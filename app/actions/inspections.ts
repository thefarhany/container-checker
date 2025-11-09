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
    // Extract container data
    const containerData = {
      companyName: formData.get("companyName") as string,
      containerNo: formData.get("containerNo") as string,
      sealNo: formData.get("sealNo") as string,
      plateNo: formData.get("plateNo") as string,
      inspectionDate: new Date(formData.get("inspectionDate") as string),
    };

    const inspectorName = formData.get("inspectorName") as string;
    const remarks = (formData.get("remarks") as string) || null;

    // Validate required fields
    if (
      !containerData.companyName ||
      !containerData.containerNo ||
      !containerData.sealNo ||
      !containerData.plateNo ||
      !inspectorName
    ) {
      throw new Error("Semua field wajib harus diisi");
    }

    // ✅ CHECK: Container number already exists
    const existingContainer = await prisma.container.findUnique({
      where: { containerNo: containerData.containerNo },
    });

    if (existingContainer) {
      throw new Error(
        `Nomor kontainer "${containerData.containerNo}" sudah digunakan. Silakan gunakan nomor lain.`
      );
    }

    // ✅ CHECK: Seal number already exists
    const existingSeal = await prisma.container.findFirst({
      where: { sealNo: containerData.sealNo },
    });

    if (existingSeal) {
      throw new Error(
        `Nomor seal "${containerData.sealNo}" sudah digunakan. Silakan gunakan nomor lain.`
      );
    }

    // Extract checklist responses
    const checklistItems = await prisma.checklistItem.findMany({
      where: { isActive: true },
    });

    const responses = checklistItems.map((item) => ({
      checklistItemId: item.id,
      checked: formData.get(`checklist_${item.id}`) === "on",
      notes: (formData.get(`notes_${item.id}`) as string) || null,
    }));

    // Validate at least 1 item is checked
    const atLeastOneChecked = responses.some((r) => r.checked === true);
    if (!atLeastOneChecked) {
      throw new Error(
        "Minimal 1 item checklist harus diperiksa sebelum submit"
      );
    }

    // Handle photo uploads
    const photos = formData.getAll("photos") as File[];
    const validPhotos = photos.filter((photo) => photo && photo.size > 0);

    if (validPhotos.length < 1) {
      throw new Error("Minimal 1 foto harus diupload");
    }

    if (validPhotos.length > 20) {
      throw new Error("Maksimal 20 foto dapat diupload");
    }

    const uploadedPhotoUrls: {
      url: string;
      filename: string;
    }[] = [];

    for (const photo of validPhotos) {
      try {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `inspections/${fileName}`;

        const arrayBuffer = await photo.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
          .from("container-photos")
          .upload(filePath, buffer, {
            contentType: photo.type,
            upsert: false,
          });

        if (uploadError) {
          // Cleanup uploaded files on error
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

        const { data: urlData } = supabaseAdmin.storage
          .from("container-photos")
          .getPublicUrl(filePath);

        uploadedPhotoUrls.push({
          url: urlData.publicUrl,
          filename: photo.name,
        });
      } catch (error) {
        // Cleanup on individual photo error
        if (uploadedPhotoUrls.length > 0) {
          const filePaths = uploadedPhotoUrls.map((p) =>
            p.url.split("/").slice(-2).join("/")
          );
          await supabaseAdmin.storage
            .from("container-photos")
            .remove(filePaths);
        }
        throw error;
      }
    }

    // Save to database in transaction
    await prisma.$transaction(async (tx) => {
      const container = await tx.container.create({
        data: containerData,
      });

      const securityCheck = await tx.securityCheck.create({
        data: {
          containerId: container.id,
          userId: session.userId,
          inspectorName,
          remarks,
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
    redirect("/security/dashboard");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gagal menyimpan data pemeriksaan");
  }
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
    // Get existing inspection
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

    // Extract container data
    const containerData = {
      companyName: formData.get("companyName") as string,
      containerNo: formData.get("containerNo") as string,
      sealNo: formData.get("sealNo") as string,
      plateNo: formData.get("plateNo") as string,
      inspectionDate: new Date(formData.get("inspectionDate") as string),
    };

    const inspectorName = formData.get("inspectorName") as string;
    const remarks = (formData.get("remarks") as string) || null;
    const deletedPhotoIds = formData.getAll("deletedPhotoIds") as string[];

    // Extract checklist responses
    const checklistItems = await prisma.checklistItem.findMany({
      where: { isActive: true },
    });

    const responses = checklistItems.map((item) => ({
      checklistItemId: item.id,
      checked: formData.get(`checklist_${item.id}`) === "on",
      notes: (formData.get(`notes_${item.id}`) as string) || null,
    }));

    // Handle photo uploads
    const photos = formData.getAll("photos") as File[];
    const validPhotos = photos.filter((photo) => photo && photo.size > 0);

    const uploadedPhotoUrls: {
      url: string;
      filename: string;
    }[] = [];

    const remainingPhotoCount =
      inspection.photos.length - deletedPhotoIds.length;
    const totalPhotoCount = remainingPhotoCount + validPhotos.length;

    if (totalPhotoCount < 1) {
      throw new Error(
        `Total foto minimal 1. Saat ini akan tersisa ${totalPhotoCount} foto.`
      );
    }

    if (totalPhotoCount > 20) {
      throw new Error(
        `Total foto maksimal 20. Saat ini akan ada ${totalPhotoCount} foto.`
      );
    }

    // Upload new photos
    for (const photo of validPhotos) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `inspections/${fileName}`;

      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from("container-photos")
        .upload(filePath, buffer, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `Gagal upload foto ${photo.name}: ${uploadError.message}`
        );
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("container-photos")
        .getPublicUrl(filePath);

      uploadedPhotoUrls.push({
        url: urlData.publicUrl,
        filename: photo.name,
      });
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update container
      await tx.container.update({
        where: { id: inspection.containerId },
        data: containerData,
      });

      // Update security check
      await tx.securityCheck.update({
        where: { id: inspectionId },
        data: {
          inspectorName,
          remarks,
          inspectionDate: containerData.inspectionDate,
        },
      });

      // Delete and recreate responses
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

      // Delete removed photos
      if (deletedPhotoIds.length > 0) {
        const photosToDelete = inspection.photos.filter((p) =>
          deletedPhotoIds.includes(p.id)
        );

        for (const photo of photosToDelete) {
          const filePath = photo.url.split("/").slice(-2).join("/");
          try {
            await supabaseAdmin.storage
              .from("container-photos")
              .remove([filePath]);
          } catch {
            // Continue even if delete fails
          }
        }

        await tx.photo.deleteMany({
          where: { id: { in: deletedPhotoIds } },
        });
      }

      // Create new photos
      if (uploadedPhotoUrls.length > 0) {
        await tx.photo.createMany({
          data: uploadedPhotoUrls.map((photo) => ({
            securityCheckId: inspectionId,
            url: photo.url,
            filename: photo.filename,
          })),
        });
      }
    });

    revalidatePath("/security/dashboard");
    revalidatePath(`/security/inspection/${inspectionId}`);
    redirect("/security/dashboard");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gagal mengupdate data pemeriksaan");
  }
}

/**
 * Delete inspection and all related data
 * @returns { success: boolean; error?: string }
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
      return {
        success: false,
        error: "Pemeriksaan tidak ditemukan",
      };
    }

    if (inspection.userId !== session.userId) {
      return {
        success: false,
        error:
          "Unauthorized - Anda tidak memiliki akses untuk menghapus data ini",
      };
    }

    // Collect all photo URLs to delete
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

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete photos from storage
      if (allPhotoUrls.length > 0) {
        try {
          await supabaseAdmin.storage
            .from("container-photos")
            .remove(allPhotoUrls);
        } catch {
          // Continue even if delete fails
        }
      }

      // Delete container (CASCADE deletes related data)
      await tx.container.delete({
        where: { id: inspection.containerId },
      });
    });

    revalidatePath("/security/dashboard");
    revalidatePath("/security/inspections");
    revalidatePath("/checker/dashboard");

    return { success: true };
  } catch (err) {
    let errorMessage = "Gagal menghapus data pemeriksaan";

    if (err instanceof Error) {
      if (err.message.includes("Foreign key constraint")) {
        errorMessage =
          "Tidak dapat menghapus data karena masih memiliki relasi dengan data lain";
      } else if (err.message.includes("Record to delete does not exist")) {
        errorMessage = "Data tidak ditemukan atau sudah dihapus";
      } else {
        errorMessage = err.message;
      }
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Delete single photo from inspection
 * @returns { success?: boolean; error?: string }
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
  } catch {
    return { error: "Gagal menghapus foto" };
  }
}
