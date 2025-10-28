"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function submitCheckerData(
  containerId: string,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "CHECKER") {
    return { error: "Unauthorized" };
  }

  try {
    const utcNo = formData.get("utcNo") as string;
    const remarks = formData.get("remarks") as string;

    console.log("📋 Received data:");
    console.log("  UTC No:", utcNo);
    console.log("  Remarks:", remarks ? "Yes" : "No");

    const existingUTC = await prisma.checkerData.findUnique({
      where: { utcNo },
    });

    if (existingUTC) {
      return { error: "Nomor UTC sudah digunakan. Gunakan nomor lain." };
    }

    const photos = formData.getAll("photos") as File[];
    const uploadedPhotoUrls: { url: string; filename: string }[] = [];

    console.log("📸 Total photos to upload:", photos.length);

    for (const photo of photos) {
      if (!photo || photo.size === 0) {
        console.log("⏭️ Skipping empty file");
        continue;
      }

      console.log("📤 Uploading:", photo.name, "Size:", photo.size);

      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `checker/${fileName}`;

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
        return {
          error: `Gagal upload foto ${photo.name}: ${uploadError.message}`,
        };
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

    if (uploadedPhotoUrls.length === 0) {
      return { error: "Minimal 1 foto harus diupload" };
    }

    await prisma.$transaction(async (tx) => {
      const checkerData = await tx.checkerData.create({
        data: {
          containerId,
          userId: session.userId,
          utcNo,
          remarks: remarks || null,
        },
      });

      await tx.photo.createMany({
        data: uploadedPhotoUrls.map((photo) => ({
          checkerDataId: checkerData.id,
          url: photo.url,
          filename: photo.filename,
        })),
      });
    });

    console.log("✅ Checker data saved successfully");
    revalidatePath("/checker/dashboard");
  } catch (error) {
    console.error("❌ Error submitting checker data:", error);
    return {
      error:
        error instanceof Error ? error.message : "Gagal menyimpan data checker",
    };
  }

  redirect("/checker/dashboard");
}

export async function updateCheckerData(
  checkerDataId: string,
  formData: FormData
): Promise<void> {
  const session = await getSession();

  if (!session || session.role !== "CHECKER") {
    redirect("/");
  }

  try {
    const checkerData = await prisma.checkerData.findUnique({
      where: { id: checkerDataId },
      include: {
        photos: true,
        container: true,
      },
    });

    if (!checkerData || checkerData.userId !== session.userId) {
      redirect("/");
    }

    const utcNo = formData.get("utcNo") as string;
    const remarks = formData.get("remarks") as string;
    const deletedPhotoIds = formData.getAll("deletedPhotoIds") as string[];

    const existingUTC = await prisma.checkerData.findFirst({
      where: {
        utcNo,
        id: { not: checkerDataId },
      },
    });

    if (existingUTC) {
      throw new Error("Nomor UTC sudah digunakan. Gunakan nomor lain.");
    }

    const photos = formData.getAll("photos") as File[];
    const validPhotos = photos.filter((photo) => photo && photo.size > 0);
    const uploadedPhotoUrls: { url: string; filename: string }[] = [];

    for (const photo of validPhotos) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `checker/${fileName}`;

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
    }

    await prisma.$transaction(async (tx) => {
      await tx.checkerData.update({
        where: { id: checkerDataId },
        data: {
          utcNo,
          remarks: remarks || null,
        },
      });

      if (deletedPhotoIds.length > 0) {
        const photosToDelete = checkerData.photos.filter((p) =>
          deletedPhotoIds.includes(p.id)
        );

        for (const photo of photosToDelete) {
          const filePath = photo.url.split("/").slice(-2).join("/");
          await supabaseAdmin.storage
            .from("container-photos")
            .remove([filePath]);
        }

        await tx.photo.deleteMany({
          where: {
            id: { in: deletedPhotoIds },
          },
        });
      }

      if (uploadedPhotoUrls.length > 0) {
        await tx.photo.createMany({
          data: uploadedPhotoUrls.map((photo) => ({
            checkerDataId,
            url: photo.url,
            filename: photo.filename,
          })),
        });
      }
    });

    revalidatePath("/checker/dashboard");
    revalidatePath(`/checker/detail/${checkerData.containerId}`);
  } catch (error) {
    console.error("❌ Error updating checker data:", error);

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gagal mengupdate data checker");
  }

  redirect("/checker/dashboard");
}

export async function deleteCheckerData(checkerDataId: string) {
  const session = await getSession();
  if (!session || session.role !== "CHECKER") {
    return { error: "Unauthorized" };
  }

  try {
    const checkerData = await prisma.checkerData.findUnique({
      where: { id: checkerDataId },
      include: { photos: true },
    });

    if (!checkerData || checkerData.userId !== session.userId) {
      return { error: "Unauthorized" };
    }

    for (const photo of checkerData.photos) {
      const filePath = photo.url.split("/").slice(-2).join("/");
      await supabaseAdmin.storage.from("container-photos").remove([filePath]);
    }

    await prisma.checkerData.delete({
      where: { id: checkerDataId },
    });

    revalidatePath("/checker/dashboard");
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting checker data:", error);
    return { error: "Gagal menghapus data checker" };
  }
}

export async function deleteCheckerPhoto(photoId: string) {
  const session = await getSession();
  if (!session || session.role !== "CHECKER") {
    return { error: "Unauthorized" };
  }

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        checkerData: true,
      },
    });

    if (!photo || photo.checkerData?.userId !== session.userId) {
      return { error: "Unauthorized" };
    }

    const filePath = photo.url.split("/").slice(-2).join("/");
    await supabaseAdmin.storage.from("container-photos").remove([filePath]);

    await prisma.photo.delete({
      where: { id: photoId },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting photo:", error);
    return { error: "Gagal menghapus foto" };
  }
}
