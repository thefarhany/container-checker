"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function submitCheckerData(
  containerId: string,
  formData: FormData
): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "CHECKER") {
    throw new Error("Unauthorized");
  }

  try {
    const utcNo = formData.get("utcNo") as string;
    const remarks = formData.get("remarks") as string;

    if (!utcNo) {
      throw new Error("Nomor UTC harus diisi");
    }

    const existingUTC = await prisma.checkerData.findUnique({
      where: { utcNo },
    });

    if (existingUTC) {
      throw new Error("Nomor UTC sudah digunakan. Gunakan nomor lain.");
    }

    const photos = formData.getAll("photos") as File[];
    const uploadedPhotoUrls: { url: string; filename: string }[] = [];

    for (const photo of photos) {
      if (!photo || photo.size === 0) {
        continue;
      }

      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `checker/${fileName}`;

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

    if (uploadedPhotoUrls.length === 0) {
      throw new Error("Minimal 1 foto harus diupload");
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

    revalidatePath("/checker/dashboard");
    redirect("/checker/dashboard");
  } catch {
    throw new Error("Gagal menyimpan data checker");
  }
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

      const { error: uploadError } = await supabaseAdmin.storage
        .from("container-photos")
        .upload(filePath, buffer, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
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
    redirect("/checker/dashboard");
  } catch {
    throw new Error("Gagal mengupdate data checker");
  }
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
  } catch {
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
  } catch {
    return { error: "Gagal menghapus foto" };
  }
}
