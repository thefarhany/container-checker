"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Create new container inspection
 * @returns void - redirects to dashboard on success, throws on error
 */
export async function createInspection(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "SECURITY") {
    redirect("/");
  }

  try {
    const containerData = {
      companyName: formData.get("companyName") as string,
      containerNo: formData.get("containerNo") as string,
      sealNo: formData.get("sealNo") as string,
      plateNo: formData.get("plateNo") as string,
      inspectionDate: new Date(formData.get("inspectionDate") as string),
    };

    const inspectorName = formData.get("inspectorName") as string;
    const remarks = formData.get("remarks") as string;

    if (
      !containerData.companyName ||
      !containerData.containerNo ||
      !containerData.sealNo ||
      !containerData.plateNo ||
      !inspectorName
    ) {
      throw new Error("Semua field wajib harus diisi");
    }

    const existingContainer = await prisma.container.findUnique({
      where: { containerNo: containerData.containerNo },
    });

    if (existingContainer) {
      throw new Error("Nomor kontainer sudah ada. Gunakan nomor lain.");
    }

    const checklistItems = await prisma.checklistItem.findMany({
      where: { isActive: true },
    });

    const responses = checklistItems.map((item) => ({
      checklistItemId: item.id,
      checked: formData.get(`checklist_${item.id}`) === "on",
      notes: (formData.get(`notes_${item.id}`) as string) || null,
    }));

    const allChecked = responses.every((r) => r.checked === true);
    if (!allChecked) {
      throw new Error("Semua item checklist harus diperiksa sebelum submit");
    }

    const photos = formData.getAll("photos") as File[];
    const validPhotos = photos.filter((photo) => photo && photo.size > 0);
    console.log("📸 Total valid photos:", validPhotos.length);

    if (validPhotos.length < 1) {
      throw new Error("Minimal 5 foto harus diupload");
    }

    if (validPhotos.length > 20) {
      throw new Error("Maksimal 20 foto dapat diupload");
    }

    const uploadedPhotoUrls: { url: string; filename: string }[] = [];

    for (const photo of validPhotos) {
      console.log("📤 Uploading:", photo.name, "Size:", photo.size);
      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `inspections/${fileName}`;

      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("container-photos")
          .upload(filePath, buffer, {
            contentType: photo.type,
            upsert: false,
          });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);

        if (uploadedPhotoUrls.length > 0) {
          const filePaths = uploadedPhotoUrls.map((p) =>
            p.url.split("/").slice(-2).join("/")
          );
          await supabaseAdmin.storage
            .from("container-photos")
            .remove(filePaths);
        }
        throw new Error(
          `Gagal upload foto ${photo.name}: ${uploadError.message}`
        );
      }

      console.log("✅ Upload success:", uploadData.path);
      const { data: urlData } = supabaseAdmin.storage
        .from("container-photos")
        .getPublicUrl(filePath);

      uploadedPhotoUrls.push({
        url: urlData.publicUrl,
        filename: photo.name,
      });
    }

    console.log("✅ Total uploaded:", uploadedPhotoUrls.length);

    await prisma.$transaction(async (tx) => {
      const container = await tx.container.create({
        data: containerData,
      });

      const securityCheck = await tx.securityCheck.create({
        data: {
          containerId: container.id,
          userId: session.userId,
          inspectorName,
          remarks: remarks || null,
          inspectionDate: containerData.inspectionDate,
        },
      });

      await tx.securityCheckResponse.createMany({
        data: responses.map((r) => ({
          securityCheckId: securityCheck.id,
          checklistItemId: r.checklistItemId,
          checked: r.checked,
          notes: r.notes,
        })),
      });

      await tx.photo.createMany({
        data: uploadedPhotoUrls.map((photo) => ({
          securityCheckId: securityCheck.id,
          url: photo.url,
          filename: photo.filename,
        })),
      });
    });

    revalidatePath("/security/dashboard");
    console.log("✅ Inspection created successfully");
  } catch (error) {
    console.error("❌ Error creating inspection:", error);

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gagal menyimpan data pemeriksaan");
  }

  redirect("/security/dashboard");
}

/**
 * Update existing container inspection
 * @returns void - redirects to dashboard on success, throws on error
 */
export async function updateInspection(
  inspectionId: string,
  formData: FormData
): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "SECURITY") {
    redirect("/");
  }

  try {
    const inspection = await prisma.securityCheck.findUnique({
      where: { id: inspectionId },
      include: {
        container: true,
        photos: true,
      },
    });

    if (!inspection || inspection.userId !== session.userId) {
      redirect("/");
    }

    const containerData = {
      companyName: formData.get("companyName") as string,
      containerNo: formData.get("containerNo") as string,
      sealNo: formData.get("sealNo") as string,
      plateNo: formData.get("plateNo") as string,
      inspectionDate: new Date(formData.get("inspectionDate") as string),
    };

    const inspectorName = formData.get("inspectorName") as string;
    const remarks = formData.get("remarks") as string;

    const deletedPhotoIds = formData.getAll("deletedPhotoIds") as string[];
    console.log("🗑️ Photos to delete:", deletedPhotoIds);

    const checklistItems = await prisma.checklistItem.findMany({
      where: { isActive: true },
    });

    const responses = checklistItems.map((item) => ({
      checklistItemId: item.id,
      checked: formData.get(`checklist_${item.id}`) === "on",
      notes: (formData.get(`notes_${item.id}`) as string) || null,
    }));

    const photos = formData.getAll("photos") as File[];
    const validPhotos = photos.filter((photo) => photo && photo.size > 0);
    const uploadedPhotoUrls: { url: string; filename: string }[] = [];

    const remainingPhotoCount =
      inspection.photos.length - deletedPhotoIds.length;
    const totalPhotoCount = remainingPhotoCount + validPhotos.length;

    console.log("📊 Photo count:", {
      existing: inspection.photos.length,
      toDelete: deletedPhotoIds.length,
      remaining: remainingPhotoCount,
      toUpload: validPhotos.length,
      total: totalPhotoCount,
    });

    if (totalPhotoCount < 1) {
      throw new Error(
        `Total foto minimal 5. Saat ini akan tersisa ${totalPhotoCount} foto.`
      );
    }

    if (totalPhotoCount > 20) {
      throw new Error(
        `Total foto maksimal 20. Saat ini akan ada ${totalPhotoCount} foto.`
      );
    }

    for (const photo of validPhotos) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `inspections/${fileName}`;

      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("container-photos")
          .upload(filePath, buffer, {
            contentType: photo.type,
            upsert: false,
          });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        throw new Error(`Gagal upload foto ${photo.name}`);
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("container-photos")
        .getPublicUrl(filePath);

      uploadedPhotoUrls.push({
        url: urlData.publicUrl,
        filename: photo.name,
      });
      console.log("✅ Uploaded:", fileName);
    }

    await prisma.$transaction(async (tx) => {
      await tx.container.update({
        where: { id: inspection.containerId },
        data: containerData,
      });

      await tx.securityCheck.update({
        where: { id: inspectionId },
        data: {
          inspectorName,
          remarks: remarks || null,
          inspectionDate: containerData.inspectionDate,
        },
      });

      await tx.securityCheckResponse.deleteMany({
        where: { securityCheckId: inspectionId },
      });

      await tx.securityCheckResponse.createMany({
        data: responses.map((r) => ({
          securityCheckId: inspectionId,
          checklistItemId: r.checklistItemId,
          checked: r.checked,
          notes: r.notes,
        })),
      });

      if (deletedPhotoIds.length > 0) {
        const photosToDelete = inspection.photos.filter((p) =>
          deletedPhotoIds.includes(p.id)
        );

        for (const photo of photosToDelete) {
          const filePath = photo.url.split("/").slice(-2).join("/");
          await supabaseAdmin.storage
            .from("container-photos")
            .remove([filePath]);
          console.log("🗑️ Deleted from storage:", filePath);
        }

        await tx.photo.deleteMany({
          where: {
            id: { in: deletedPhotoIds },
          },
        });
        console.log("✅ Deleted photos from database:", deletedPhotoIds.length);
      }

      if (uploadedPhotoUrls.length > 0) {
        await tx.photo.createMany({
          data: uploadedPhotoUrls.map((photo) => ({
            securityCheckId: inspectionId,
            url: photo.url,
            filename: photo.filename,
          })),
        });
        console.log("✅ Added new photos:", uploadedPhotoUrls.length);
      }
    });

    revalidatePath("/security/dashboard");
    revalidatePath(`/security/inspection/${inspectionId}`);
    console.log("✅ Inspection updated successfully");
  } catch (error) {
    console.error("❌ Error updating inspection:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gagal mengupdate data pemeriksaan");
  }

  redirect("/security/dashboard");
}

/**
 * Delete inspection by deleting the entire container
 * This will CASCADE delete all related data:
 * - SecurityCheck and its responses/photos
 * - CheckerData and its photos (if exists)
 *
 * @returns { success: boolean; error?: string } - result object for API calls
 */
export async function deleteInspection(inspectionId: string) {
  const session = await getSession();
  if (!session || session.role !== "SECURITY") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const inspection = await prisma.securityCheck.findUnique({
      where: { id: inspectionId },
      include: {
        photos: true,
        container: {
          include: {
            securityCheck: {
              include: {
                photos: true,
                responses: true,
              },
            },
            checkerData: {
              include: {
                photos: true,
              },
            },
          },
        },
      },
    });

    if (!inspection) {
      return { success: false, error: "Pemeriksaan tidak ditemukan" };
    }

    if (inspection.userId !== session.userId) {
      return {
        success: false,
        error:
          "Unauthorized - Anda tidak memiliki akses untuk menghapus data ini",
      };
    }

    const allPhotoUrls: string[] = [];

    if (inspection.container.securityCheck?.photos) {
      inspection.container.securityCheck.photos.forEach((photo) => {
        const filePath = photo.url.split("/").slice(-2).join("/");
        allPhotoUrls.push(filePath);
      });
    }

    if (inspection.container.checkerData?.photos) {
      inspection.container.checkerData.photos.forEach((photo) => {
        const filePath = photo.url.split("/").slice(-2).join("/");
        allPhotoUrls.push(filePath);
      });
    }

    console.log(`📊 Total photos to delete: ${allPhotoUrls.length}`);

    await prisma.$transaction(async (tx) => {
      if (allPhotoUrls.length > 0) {
        try {
          const { data, error } = await supabaseAdmin.storage
            .from("container-photos")
            .remove(allPhotoUrls);

          if (error) {
            console.error("⚠️ Error deleting photos from storage:", error);
          } else {
            console.log(
              `✅ Deleted ${allPhotoUrls.length} photos from storage`
            );
          }
        } catch (photoError) {
          console.error("⚠️ Storage deletion error:", photoError);
        }
      }

      await tx.container.delete({
        where: { id: inspection.containerId },
      });

      console.log("✅ Deleted container and all related data via CASCADE");
      console.log(`   - Container ID: ${inspection.containerId}`);
      console.log(`   - Container No: ${inspection.container.containerNo}`);
    });

    revalidatePath("/security/dashboard");
    revalidatePath("/security/inspections");
    revalidatePath("/checker/dashboard");

    console.log("✅ Successfully deleted container:", inspection.containerId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting inspection:", error);

    let errorMessage = "Gagal menghapus data pemeriksaan";

    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        errorMessage =
          "Tidak dapat menghapus data karena masih memiliki relasi dengan data lain";
      } else if (error.message.includes("Record to delete does not exist")) {
        errorMessage = "Data tidak ditemukan atau sudah dihapus";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete single photo from inspection
 * @returns { success?: boolean; error?: string } - result object
 */
export async function deletePhoto(photoId: string) {
  const session = await getSession();
  if (!session || session.role !== "SECURITY") {
    return { error: "Unauthorized" };
  }

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        securityCheck: true,
      },
    });

    if (!photo || photo.securityCheck?.userId !== session.userId) {
      return { error: "Unauthorized" };
    }

    const filePath = photo.url.split("/").slice(-2).join("/");
    await supabaseAdmin.storage.from("container-photos").remove([filePath]);

    await prisma.photo.delete({
      where: { id: photoId },
    });

    revalidatePath("/security/dashboard");
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting photo:", error);
    return { error: "Gagal menghapus foto" };
  }
}
