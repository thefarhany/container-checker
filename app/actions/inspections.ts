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
    const remarks = (formData.get("remarks") as string) || null;

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
      throw new Error(
        `Nomor kontainer "${containerData.containerNo}" sudah digunakan. Silakan gunakan nomor lain.`
      );
    }

    const existingSeal = await prisma.container.findFirst({
      where: { sealNo: containerData.sealNo },
    });
    if (existingSeal) {
      throw new Error(
        `Nomor seal "${containerData.sealNo}" sudah digunakan. Silakan gunakan nomor lain.`
      );
    }

    const checklistItems = await prisma.checklistItem.findMany({
      where: { isActive: true },
    });

    const responses = checklistItems.map((item) => ({
      checklistItemId: item.id,
      checked: formData.get(`checklist-${item.id}`) === "on",
      notes: (formData.get(`notes-${item.id}`) as string) || null,
    }));

    const atLeastOneChecked = responses.some((r) => r.checked === true);
    if (!atLeastOneChecked) {
      throw new Error(
        "Minimal 1 item checklist harus diperiksa sebelum submit"
      );
    }

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

      const createdResponses = await tx.securityCheckResponse.findMany({
        where: { securityCheckId: securityCheck.id },
        select: {
          id: true,
          checklistItemId: true,
          checked: true,
          notes: true,
        },
      });

      const historyData = createdResponses.map((response) => ({
        responseId: response.id,
        checklistItemId: response.checklistItemId,
        securityCheckId: securityCheck.id,
        notes: response.notes,
        checked: response.checked,
        changedBy: session.userId,
      }));

      if (historyData.length > 0) {
        await tx.securityCheckResponseHistory.createMany({
          data: historyData,
        });
      }

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
    const inspection = await prisma.securityCheck.findUnique({
      where: { id: inspectionId },
      include: {
        container: true,
        photos: true,
        responses: true,
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
    const remarks = (formData.get("remarks") as string) || null;
    const deletedPhotoIds = formData.getAll("deletedPhotoIds") as string[];

    const checklistItems = await prisma.checklistItem.findMany({
      where: { isActive: true },
    });

    const responses = checklistItems.map((item) => ({
      checklistItemId: item.id,
      checked: formData.get(`checklist-${item.id}`) === "on",
      notes: (formData.get(`notes-${item.id}`) as string) || null,
    }));

    const photos = formData.getAll("photos") as File[];
    const validPhotos = photos.filter((photo) => photo && photo.size > 0);
    const uploadedPhotoUrls: { url: string; filename: string }[] = [];

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

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("container-photos").getPublicUrl(filePath);

      uploadedPhotoUrls.push({
        url: publicUrl,
        filename: photo.name,
      });
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.container.update({
          where: { id: inspection.containerId },
          data: containerData,
        });

        await tx.securityCheck.update({
          where: { id: inspectionId },
          data: {
            inspectorName,
            remarks,
            inspectionDate: containerData.inspectionDate,
          },
        });

        const oldResponses = inspection.responses;

        const changedItems = [];
        for (const newResponse of responses) {
          const oldResponse = oldResponses.find(
            (r) => r.checklistItemId === newResponse.checklistItemId
          );

          if (oldResponse) {
            const oldNotes = oldResponse.notes || "";
            const newNotes = newResponse.notes || "";
            const hasChanged =
              oldResponse.checked !== newResponse.checked ||
              oldNotes !== newNotes;

            if (hasChanged) {
              changedItems.push({
                checklistItemId: newResponse.checklistItemId,
                notes: newResponse.notes,
                checked: newResponse.checked,
              });
            }
          }
        }

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

        const newResponsesCreated = await tx.securityCheckResponse.findMany({
          where: { securityCheckId: inspectionId },
        });

        if (changedItems.length > 0) {
          const historyData = [];
          for (const item of changedItems) {
            const newResponse = newResponsesCreated.find(
              (r) => r.checklistItemId === item.checklistItemId
            );

            if (newResponse) {
              historyData.push({
                responseId: newResponse.id,
                checklistItemId: item.checklistItemId,
                securityCheckId: inspectionId,
                notes: item.notes,
                checked: item.checked,
                changedBy: session.userId,
              });
            }
          }

          if (historyData.length > 0) {
            await tx.securityCheckResponseHistory.createMany({
              data: historyData,
            });
          }
        }

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
            } catch {}
          }

          await tx.photo.deleteMany({
            where: { id: { in: deletedPhotoIds } },
          });
        }

        if (uploadedPhotoUrls.length > 0) {
          await tx.photo.createMany({
            data: uploadedPhotoUrls.map((photo) => ({
              securityCheckId: inspectionId,
              url: photo.url,
              filename: photo.filename,
            })),
          });
        }
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gagal mengupdate data pemeriksaan");
  }

  revalidatePath("/security/dashboard");
  revalidatePath(`/security/inspection/${inspectionId}`);
  redirect("/security/dashboard");
}

/**
 * Delete container (for SECURITY and ADMIN)
 * - SECURITY can only delete their own containers
 * - ADMIN can delete any container
 */
export async function deleteInspection(containerId: string) {
  const session = await getSession();
  if (!session || (session.role !== "SECURITY" && session.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        securityCheck: {
          include: {
            photos: true,
            responses: {
              include: {
                history: true,
              },
            },
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
          error: "Anda tidak memiliki akses untuk menghapus data ini",
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
        } catch (error) {
          console.error("Error deleting photos from storage:", error);
        }
      }

      if (container.securityCheck) {
        await tx.securityCheckResponseHistory.deleteMany({
          where: {
            securityCheckId: container.securityCheck.id,
          },
        });
      }

      if (container.securityCheck) {
        await tx.photo.deleteMany({
          where: {
            securityCheckId: container.securityCheck.id,
          },
        });
      }

      if (container.checkerData) {
        await tx.photo.deleteMany({
          where: {
            checkerDataId: container.checkerData.id,
          },
        });
      }

      if (container.securityCheck) {
        await tx.securityCheckResponse.deleteMany({
          where: {
            securityCheckId: container.securityCheck.id,
          },
        });
      }

      if (container.securityCheck) {
        await tx.securityCheck.delete({
          where: {
            id: container.securityCheck.id,
          },
        });
      }

      if (container.checkerData) {
        await tx.checkerData.delete({
          where: {
            id: container.checkerData.id,
          },
        });
      }

      await tx.container.delete({
        where: { id: containerId },
      });
    });

    revalidatePath("/security/dashboard");
    revalidatePath("/security/inspections");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/containers");
    revalidatePath("/checker/dashboard");

    return { success: true };
  } catch (err) {
    let errorMessage = "Gagal menghapus data kontainer";
    if (err instanceof Error) {
      if (err.message.includes("Foreign key constraint")) {
        errorMessage =
          "Tidak dapat menghapus data karena masih memiliki relasi";
      } else if (err.message.includes("Record to delete does not exist")) {
        errorMessage = "Data tidak ditemukan atau sudah dihapus";
      } else {
        errorMessage = err.message;
      }
    }
    console.error("Delete error:", err);
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
