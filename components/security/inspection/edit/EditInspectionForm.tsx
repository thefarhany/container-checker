"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateInspection } from "@/app/actions/inspections";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ImageUploadClient from "@/components/security/inspection/ImageUploadClient";

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

// ✅ Add interface untuk responseMap
interface ResponseMap {
  [key: string]: SecurityCheckResponse;
}

export default function EditInspectionForm({
  inspection,
  categories,
}: {
  inspection: Inspection;
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  // ✅ HAPUS: const [deletedPhotos, setDeletedPhotos] = useTransition();

  const handleDeletePhoto = (photoId: string) => {
    // ✅ GUNAKAN fungsi biasa tanpa setDeletedPhotos
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
      } catch (error: unknown) {
        // ✅ Fix error: any to error: unknown
        const err = error as { message?: string; digest?: string };

        if (
          err?.message === "NEXT_REDIRECT" ||
          err?.digest?.startsWith("NEXT_REDIRECT") ||
          (err?.message && String(err.message).includes("NEXT_REDIRECT"))
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

  // ✅ Fix acc: any dengan proper type
  const responseMap = inspection.responses.reduce(
    (acc: ResponseMap, response: SecurityCheckResponse) => {
      acc[response.checklistItemId] = response;
      return acc;
    },
    {} as ResponseMap
  );

  const formatDatetime = (date: Date) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link
            href={`/security/inspection/${inspection.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Detail Pemeriksaan
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Pemeriksaan Kontainer
          </h1>
          <p className="text-gray-600 mt-2">
            Perbarui informasi pemeriksaan dengan lengkap dan teliti
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form action={handleSubmit} className="space-y-8">
          {/* Container Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informasi Kontainer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Kontainer
                </label>
                <input
                  type="text"
                  defaultValue={inspection.container.containerNo}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  defaultValue={inspection.container.companyName}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Inspector
                </label>
                <input
                  type="text"
                  name="inspectorName"
                  defaultValue={inspection.inspectorName}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal & Waktu Pemeriksaan
                </label>
                <input
                  type="datetime-local"
                  name="inspectionDate"
                  defaultValue={formatDatetime(inspection.inspectionDate)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Checklist Pemeriksaan
            </h2>
            <div className="space-y-6">
              {categories.map((category: Category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {category.description}
                    </p>
                  )}
                  <div className="space-y-3">
                    {category.items.map((item) => {
                      const response = responseMap[item.id];
                      return (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            name={`response_${item.id}`}
                            value="true"
                            defaultChecked={response?.checked}
                            className="mt-1 w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {item.itemText}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1">
                                {item.description}
                              </p>
                            )}
                            {response?.notes && (
                              <p className="text-xs text-blue-600 mt-1 italic">
                                Catatan: {response.notes}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Existing Photos */}
          {inspection.photos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Foto Pemeriksaan Saat Ini
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inspection.photos.map((photo: Photo) => (
                  <div
                    key={photo.id}
                    id={`photo-${photo.id}`}
                    className="relative group"
                  >
                    {/* ✅ Add eslint disable comment */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {photo.filename}
                    </p>
                  </div>
                ))}
              </div>
              <input
                type="hidden"
                id="deletedPhotoIds"
                name="deletedPhotoIds"
              />
            </div>
          )}

          {/* New Photos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Foto Baru
            </h2>
            <ImageUploadClient />
          </div>

          {/* Remarks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Pemeriksaan
            </label>
            <textarea
              name="remarks"
              defaultValue={inspection.remarks || ""}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href={`/security/inspection/${inspection.id}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
