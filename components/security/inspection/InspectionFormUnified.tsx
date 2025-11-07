"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  createInspection,
  updateInspection,
  deleteInspection,
} from "@/app/actions/inspections";
import { ArrowLeft, Check, Trash2, X } from "lucide-react";
import Link from "next/link";
import ImageUploadClientUnified from "@/components/security/inspection/ImageUploadClientUnified";

type FormMode = "create" | "edit" | "view";

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
  createdAt?: Date;
  updatedAt?: Date;
  photos: Photo[];
  responses: SecurityCheckResponse[];
  container: Container;
}

interface ChecklistItem {
  id: string;
  itemText: string;
  description: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  order: number;
  items: ChecklistItem[];
}

interface ResponseMap {
  [key: string]: SecurityCheckResponse;
}

interface InspectionFormUnifiedProps {
  mode: FormMode;
  categories: Category[];
  inspection?: Inspection;
  defaultInspectorName?: string;
  backLink?: string;
}

export default function InspectionFormUnified({
  mode,
  categories,
  inspection,
  defaultInspectorName = "",
  backLink = "/security",
}: InspectionFormUnifiedProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDatetime = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const getTitleAndSubtitle = () => {
    switch (mode) {
      case "create":
        return {
          title: "Form Pemeriksaan Kontainer",
          subtitle: "Isi formulir pemeriksaan dengan lengkap dan teliti",
        };
      case "edit":
        return {
          title: "Edit Pemeriksaan Kontainer",
          subtitle: "Perbarui informasi pemeriksaan dengan lengkap dan teliti",
        };
      case "view":
        return {
          title: "Detail Pemeriksaan Kontainer",
          subtitle: `Dibuat: ${
            inspection?.createdAt ? formatDate(inspection.createdAt) : "-"
          }`,
        };
    }
  };

  const { title, subtitle } = getTitleAndSubtitle();

  const handleDeletePhoto = (photoId: string) => {
    setDeletedPhotoIds((prev) => [...prev, photoId]);
  };

  const handleUndoDeletePhoto = (photoId: string) => {
    setDeletedPhotoIds((prev) => prev.filter((id) => id !== photoId));
  };

  const handleDeleteInspection = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus pemeriksaan ini? Data tidak dapat dikembalikan."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    const loadingToast = toast.loading("Menghapus pemeriksaan...", {
      description: "Mohon tunggu, sedang menghapus data pemeriksaan",
    });

    const result = await deleteInspection(inspection!.id);

    if (result.success) {
      toast.dismiss(loadingToast);
      toast.success("Pemeriksaan Berhasil Dihapus! ✓", {
        description: "Data pemeriksaan telah dihapus dari database",
        duration: 5000,
      });
      setTimeout(() => (window.location.href = backLink), 1500);
    } else {
      toast.dismiss(loadingToast);
      setIsDeleting(false);
      toast.error("Gagal Menghapus Pemeriksaan", {
        description: result.error || "Terjadi kesalahan",
        duration: 5000,
      });
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (mode === "view") return;

    if (mode === "edit") {
      deletedPhotoIds.forEach((id) => {
        formData.append("deletedPhotoIds", id);
      });
    }

    const toastMessage =
      mode === "create"
        ? "Menyimpan data pemeriksaan..."
        : "Menyimpan perubahan pemeriksaan...";
    const toastDesc =
      mode === "create"
        ? "Mohon tunggu, sedang mengupload foto dan menyimpan data"
        : "Mohon tunggu, sedang mengupload foto dan menyimpan perubahan";

    const loadingToast = toast.loading(toastMessage, {
      description: toastDesc,
    });

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createInspection(formData);
        } else if (mode === "edit") {
          await updateInspection(inspection!.id, formData);
        }

        toast.dismiss(loadingToast);

        const successMessage =
          mode === "create"
            ? "Data Container Berhasil Ditambahkan! ✓"
            : "Data Pemeriksaan Berhasil Diperbarui! ✓";
        const successDesc =
          mode === "create"
            ? "Pemeriksaan kontainer telah disimpan ke database"
            : "Perubahan pemeriksaan kontainer telah disimpan";

        toast.success(successMessage, {
          description: successDesc,
          duration: 5000,
        });
      } catch (error: unknown) {
        const err = error as {
          message?: string;
          digest?: string;
        };

        if (
          err?.message === "NEXT_REDIRECT" ||
          err?.digest?.startsWith("NEXT_REDIRECT") ||
          (err?.message && String(err.message).includes("NEXT_REDIRECT"))
        ) {
          toast.dismiss(loadingToast);
          const successMessage =
            mode === "create"
              ? "Data Container Berhasil Ditambahkan! ✓"
              : "Data Pemeriksaan Berhasil Diperbarui! ✓";
          toast.success(successMessage, {
            duration: 5000,
          });
          throw error;
        }

        toast.dismiss(loadingToast);
        toast.error("Gagal Menyimpan Data", {
          description:
            error instanceof Error ? error.message : "Terjadi kesalahan",
          duration: 5000,
        });
      }
    });
  };

  const responseMap = (inspection?.responses || []).reduce(
    (acc: ResponseMap, response) => {
      acc[response.checklistItemId] = response;
      return acc;
    },
    {} as ResponseMap
  );

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const currentPhotos = inspection?.photos || [];
  const remainingPhotos = currentPhotos.filter(
    (photo) => !deletedPhotoIds.includes(photo.id)
  );

  const checkedItems =
    inspection?.responses.filter((r) => r.checked).length || 0;
  const totalItems = inspection?.responses.length || 0;

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={backLink}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {title}
              </h1>
              <p className="text-slate-600 mt-2">{subtitle}</p>
            </div>

            {isViewMode && (
              <div className="flex gap-2">
                <Link
                  href={`/security/inspection/${inspection?.id}/edit`}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDeleteInspection}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>

        {isViewMode && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Progress Pemeriksaan
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {checkedItems} dari {totalItems} item tercentang
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-900">
                  {totalItems > 0
                    ? ((checkedItems / totalItems) * 100).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Informasi Kontainer
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Perusahaan{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-slate-900">
                    {inspection?.container.companyName}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="companyName"
                    required={!isViewMode}
                    disabled={isViewMode}
                    defaultValue={inspection?.container.companyName || ""}
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                    placeholder="Masukkan nama perusahaan"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nomor Kontainer{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-slate-900 font-mono">
                    {inspection?.container.containerNo}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="containerNo"
                    required={!isViewMode}
                    disabled={isViewMode}
                    defaultValue={inspection?.container.containerNo || ""}
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                    placeholder="Contoh: TCLU1234567"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nomor Seal{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-slate-900 font-mono">
                    {inspection?.container.sealNo}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="sealNo"
                    required={!isViewMode}
                    disabled={isViewMode}
                    defaultValue={inspection?.container.sealNo || ""}
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                    placeholder="Masukkan nomor seal"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nomor Plat{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-slate-900 font-mono">
                    {inspection?.container.plateNo}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="plateNo"
                    required={!isViewMode}
                    disabled={isViewMode}
                    defaultValue={inspection?.container.plateNo || ""}
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                    placeholder="Contoh: B 1234 AB"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal Pemeriksaan{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-slate-900">
                    {inspection?.inspectionDate
                      ? formatDate(inspection.inspectionDate)
                      : "-"}
                  </p>
                ) : (
                  <input
                    type="datetime-local"
                    name="inspectionDate"
                    required={!isViewMode}
                    disabled={isViewMode}
                    defaultValue={
                      inspection
                        ? formatDatetime(inspection.inspectionDate)
                        : ""
                    }
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Pemeriksa{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-slate-900">{inspection?.inspectorName}</p>
                ) : (
                  <input
                    type="text"
                    name="inspectorName"
                    required={!isViewMode}
                    disabled={isViewMode}
                    defaultValue={
                      inspection?.inspectorName || defaultInspectorName
                    }
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                    placeholder="Masukkan nama pemeriksa"
                  />
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Catatan Umum
              </label>
              {isViewMode ? (
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {inspection?.remarks || "-"}
                  </p>
                </div>
              ) : (
                <textarea
                  name="remarks"
                  rows={3}
                  disabled={isViewMode}
                  defaultValue={inspection?.remarks || ""}
                  className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none disabled:bg-slate-100"
                  placeholder="Masukkan catatan atau keterangan tambahan (opsional)"
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            {sortedCategories.map((category, categoryIndex) => (
              <div
                key={category.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                    {categoryIndex + 1}. {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="divide-y divide-slate-200">
                  {category.items
                    .sort((a, b) => a.order - b.order)
                    .map((item, itemIndex) => {
                      const response = responseMap[item.id];

                      return (
                        <div
                          key={item.id}
                          className="p-4 sm:p-6 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                              {itemIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm sm:text-base font-medium text-slate-900">
                                {item.itemText}
                              </p>
                              {item.description && (
                                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="ml-9 space-y-3">
                            {isViewMode ? (
                              <>
                                <div className="flex items-center gap-2">
                                  {response?.checked ? (
                                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                      <Check className="w-4 h-4" />
                                      Diperiksa
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                                      <span className="w-2 h-2 bg-yellow-600 rounded-full" />
                                      Belum Diperiksa
                                    </div>
                                  )}
                                </div>

                                {response?.notes && (
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium text-slate-700 mb-2">
                                      Catatan:
                                    </p>
                                    <div className="bg-slate-50 border border-slate-200 rounded p-2 sm:p-3">
                                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                        {response.notes}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    name={`checklist_${item.id}`}
                                    disabled={isViewMode}
                                    defaultChecked={response?.checked || false}
                                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                  />
                                  <label className="ml-2 text-sm text-slate-700 font-medium cursor-pointer">
                                    Item OK / Sesuai
                                  </label>
                                </div>

                                <div>
                                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                                    Catatan / Keterangan:
                                  </label>
                                  <textarea
                                    name={`notes_${item.id}`}
                                    rows={2}
                                    disabled={isViewMode}
                                    defaultValue={response?.notes || ""}
                                    className="w-full px-3 py-2 text-black text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none disabled:bg-slate-100"
                                    placeholder="Masukkan catatan atau temuan (opsional)"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {isEditMode && inspection && inspection.photos.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Foto Pemeriksaan Saat Ini
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {inspection.photos.map((photo) => {
                  const isDeleted = deletedPhotoIds.includes(photo.id);

                  return (
                    <div
                      key={photo.id}
                      className={`relative group rounded-lg overflow-hidden border ${
                        isDeleted
                          ? "border-red-300 bg-red-50"
                          : "border-slate-300"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className={`w-full h-32 object-cover ${
                          isDeleted ? "opacity-50" : ""
                        }`}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                        {isDeleted ? (
                          <button
                            type="button"
                            onClick={() => handleUndoDeletePhoto(photo.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition"
                          >
                            Batalkan Hapus
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-3">
                Total foto saat ini: {remainingPhotos.length}{" "}
                {remainingPhotos.length === 0 ? "(akan dihapus semua)" : ""}
              </p>
            </div>
          )}

          {isViewMode && inspection && inspection.photos.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Foto Pemeriksaan
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {inspection.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-lg overflow-hidden border border-slate-300 hover:shadow-lg transition"
                  >
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-32 object-cover group-hover:scale-105 transition"
                    />
                  </a>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-3">
                Total foto: {inspection.photos.length}
              </p>
            </div>
          )}

          {isViewMode && (!inspection || inspection.photos.length === 0) && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm text-center">
              <p className="text-slate-600">
                Tidak ada foto untuk pemeriksaan ini
              </p>
            </div>
          )}

          {!isViewMode && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {isEditMode && inspection?.photos.length
                  ? "Tambah Foto Pemeriksaan"
                  : "Upload Foto Pemeriksaan"}
              </h2>
              <ImageUploadClientUnified
                mode={isCreateMode ? "create" : "edit"}
                existingPhotos={isEditMode ? inspection?.photos : undefined}
              />
            </div>
          )}

          <div className="flex gap-3">
            {!isViewMode ? (
              <>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  {isPending
                    ? isCreateMode
                      ? "Menyimpan..."
                      : "Menyimpan Perubahan..."
                    : isCreateMode
                    ? "Simpan Pemeriksaan"
                    : "Simpan Perubahan"}
                </button>
                <Link
                  href={backLink}
                  className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`${backLink}/${inspection?.id}/edit`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
                >
                  Edit Pemeriksaan
                </Link>
                <Link
                  href={backLink}
                  className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Kembali
                </Link>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
