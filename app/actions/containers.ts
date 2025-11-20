"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Delete container and all related data (Admin can delete any container)
 * @returns { success: boolean; error?: string }
 */
export async function deleteContainer(containerId: string) {
  const session = await getSession();

  if (!session || (session.role !== "ADMIN" && session.role !== "SECURITY")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
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
    });

    if (!container) {
      return {
        success: false,
        error: "Kontainer tidak ditemukan",
      };
    }

    if (session.role === "SECURITY") {
      if (
        !container.securityCheck ||
        container.securityCheck.userId !== session.userId
      ) {
        return {
          success: false,
          error:
            "Unauthorized - Anda tidak memiliki akses untuk menghapus data ini",
        };
      }
    }

    const allPhotoUrls: string[] = [];

    if (container.securityCheck?.photos) {
      container.securityCheck.photos.forEach((photo) => {
        const filePath = photo.url.split("/").slice(-2).join("/");
        allPhotoUrls.push(filePath);
      });
    }

    if (container.checkerData?.photos) {
      container.checkerData.photos.forEach((photo) => {
        const filePath = photo.url.split("/").slice(-2).join("/");
        allPhotoUrls.push(filePath);
      });
    }

    await prisma.$transaction(async (tx) => {
      if (allPhotoUrls.length > 0) {
        try {
          await supabaseAdmin.storage
            .from("container-photos")
            .remove(allPhotoUrls);
        } catch {}
      }

      await tx.container.delete({
        where: { id: containerId },
      });
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/containers");
    revalidatePath("/security/dashboard");
    revalidatePath("/security/inspections");
    revalidatePath("/checker/dashboard");

    return { success: true };
  } catch (err) {
    let errorMessage = "Gagal menghapus data kontainer";
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
