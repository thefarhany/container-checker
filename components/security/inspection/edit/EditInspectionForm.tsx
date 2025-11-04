"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateInspection } from "@/app/actions/inspections";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ImageUploadClient from "@/components/security/inspection/ImageUploadClient";
import Image from "next/image";

interface Photo {
  id: string;
  url: string;
  filename: string;
}

interface SecurityCheckResponse {
  id: string;
  checklistItemId: string;
  checked: boolean;
  notes: string | null;
}

interface Container {
  id: string;
  companyName: string;
  containerNo: string;
  sealNo: string;
  plateNo: string;
  inspectionDate: Date;
}

interface Inspection {
  id: string;
  userId: string;
  inspectorName: string;
  remarks: string | null;
  inspectionDate: Date;
  containerId: string;
  photos: Photo[];
  responses: SecurityCheckResponse[];
  container: Container;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  items: Array<{
    id: string;
    itemText: string;
    description: string | null;
  }>;
}

export default function EditInspectionForm({
  inspection,
  categories,
}: {
  inspection: Inspection;
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  const [deletedPhotos, setDeletedPhotos] = useTransition();

  const handleDeletePhoto = (photoId: string) => {
    setDeletedPhotos(() => {
      const photoInput = document.getElementById(
        "deletedPhotoIds"
      ) as HTMLInputElement;
      if (photoInput) {
        const currentIds = photoInput.value ? photoInput.value.split(",") : [];
        if (!currentIds.includes(photoId)) {
          photoInput.value = [...currentIds, photoId].join(",");
        }
      }

      const photoElement = document.getElementById(`photo-${photoId}`);
      if (photoElement) {
        photoElement.style.display = "none";
      }
    });
  };

  const handleSubmit = async (formData: FormData) => {
    const photoInput = document.getElementById(
      "deletedPhotoIds"
    ) as HTMLInputElement;
    if (photoInput && photoInput.value) {
      formData.delete("deletedPhotoIds");
      photoInput.value.split(",").forEach((id) => {
        if (id) formData.append("deletedPhotoIds", id);
      });
    }

    const loadingToast = toast.loading("Menyimpan perubahan pemeriksaan...", {
      description:
        "Mohon tunggu, sedang mengupload foto dan menyimpan perubahan",
    });

    startTransition(async () => {
      try {
        await updateInspection(inspection.id, formData);

        toast.dismiss(loadingToast);
        toast.success("Data Pemeriksaan Berhasil Diperbarui! ✓", {
          description: "Perubahan pemeriksaan kontainer telah disimpan",
          duration: 5000,
        });
      } catch (error: any) {
        if (
          error?.message === "NEXT_REDIRECT" ||
          error?.digest?.startsWith("NEXT_REDIRECT") ||
          (error?.message && String(error.message).includes("NEXT_REDIRECT"))
        ) {
          toast.dismiss(loadingToast);
          toast.success("Data Pemeriksaan Berhasil Diperbarui! ✓", {
            description: "Perubahan pemeriksaan kontainer telah disimpan",
            duration: 5000,
          });
          throw error;
        }

        toast.dismiss(loadingToast);
        toast.error("Gagal Menyimpan Perubahan", {
          description:
            error instanceof Error ? error.message : "Terjadi kesalahan",
          duration: 5000,
        });
      }
    });
  };

  const responseMap = inspection.responses.reduce((acc: any, response) => {
    acc[response.checklistItemId] = response;
    return acc;
  }, {});

  const formatDatetime = (date: Date) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/security/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Edit Pemeriksaan Kontainer
        </h1>
        <p className="text-gray-600 mt-2">
          Perbarui informasi pemeriksaan dengan lengkap dan teliti
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" id="deletedPhotoIds" name="deletedPhotoIds" />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
              1
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Informasi Kontainer
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Perusahaan *
              </label>
              <input
                type="text"
                name="companyName"
                defaultValue={inspection.container.companyName}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Kontainer *
              </label>
              <input
                type="text"
                name="containerNo"
                defaultValue={inspection.container.containerNo}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Segel *
              </label>
              <input
                type="text"
                name="sealNo"
                defaultValue={inspection.container.sealNo}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Plat Kendaraan *
              </label>
              <input
                type="text"
                name="plateNo"
                defaultValue={inspection.container.plateNo}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pemeriksaan *
              </label>
              <input
                type="datetime-local"
                name="inspectionDate"
                defaultValue={formatDatetime(inspection.inspectionDate)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pemeriksa *
              </label>
              <input
                type="text"
                name="inspectorName"
                defaultValue={inspection.inspectorName}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>
          </div>
        </div>

        {categories.map((category, idx) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                {idx + 2}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {category.name}
              </h2>
            </div>

            {category.description && (
              <p className="text-gray-600 mb-4">{category.description}</p>
            )}

            <div className="space-y-4">
              {category.items.map((item) => {
                const response = responseMap[item.id];
                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name={`checklist_${item.id}`}
                        id={`checklist_${item.id}`}
                        defaultChecked={response?.checked || false}
                        className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`checklist_${item.id}`}
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {item.itemText}
                        </label>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                        <textarea
                          name={`notes_${item.id}`}
                          defaultValue={response?.notes || ""}
                          placeholder="Catatan (opsional)"
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {inspection.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Foto Pemeriksaan ({inspection.photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inspection.photos.map((photo) => (
                <div
                  key={photo.id}
                  id={`photo-${photo.id}`}
                  className="relative group"
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-sm">✕</span>
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {photo.filename}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <ImageUploadClient />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan Tambahan
          </label>
          <textarea
            name="remarks"
            defaultValue={inspection.remarks || ""}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
            placeholder="Tambahkan catatan atau keterangan tambahan (opsional)"
          />
        </div>

        <div className="flex gap-4 pt-6">
          <Link
            href="/security/dashboard"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
