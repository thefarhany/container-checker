"use client";

import { useTransition, useState, useRef } from "react";
import { toast } from "sonner";
import { createInspection, updateInspection } from "@/app/actions/inspections";
import { ArrowLeft, Check, History, Trash2, X } from "lucide-react";
import Link from "next/link";
import ImageUploadClientUnified from "@/components/security/ImageUploadClientUnified";

type FormMode = "create" | "edit" | "view";

interface Photo {
  id: string;
  url: string;
  filename: string;
}

interface ResponseHistory {
  id: string;
  notes: string | null;
  checked: boolean;
  changedAt: Date;
  changedBy: string;
  user: {
    name: string;
  };
}

interface SecurityCheckResponse {
  id: string;
  checklistItemId: string;
  checked: boolean;
  notes: string | null;
  history?: ResponseHistory[];
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

interface InspectorName {
  id: string;
  name: string;
}

interface InspectionFormUnifiedProps {
  mode: FormMode;
  categories: Category[];
  inspection?: Inspection;
  defaultInspectorName?: string;
  backLink?: string;
  userRole: "SECURITY" | "CHECKER";
  inspectorNames: InspectorName[];
}

export default function InspectionFormUnified({
  mode,
  categories,
  inspection,
  backLink = "/security/dashboard",
  inspectorNames,
}: InspectionFormUnifiedProps) {
  const [isPending, startTransition] = useTransition();
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

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

  const formatHistoryDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
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

        if (formRef.current) {
          formRef.current.reset();
        }
        setFormKey((prev) => prev + 1);
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
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b">
        <Link
          href={backLink}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Kembali</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>

      {isViewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            Progress Pemeriksaan
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            {checkedItems} dari {totalItems} item tercentang
          </p>
          <div className="relative w-full bg-blue-200 rounded-full h-3 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${
                  totalItems > 0
                    ? ((checkedItems / totalItems) * 100).toFixed(0)
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-2 text-right">
            {totalItems > 0
              ? ((checkedItems / totalItems) * 100).toFixed(0)
              : 0}
            %
          </p>
        </div>
      )}

      <form
        ref={formRef}
        key={formKey}
        action={handleSubmit}
        className="space-y-6"
      >
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Informasi Kontainer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Perusahaan{" "}
                {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <p className="text-gray-900">
                  {inspection?.container.companyName}
                </p>
              ) : (
                <input
                  type="text"
                  name="companyName"
                  required
                  defaultValue={inspection?.container.companyName}
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama perusahaan"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Kontainer{" "}
                {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <p className="text-gray-900">
                  {inspection?.container.containerNo}
                </p>
              ) : (
                <input
                  type="text"
                  name="containerNo"
                  required
                  defaultValue={inspection?.container.containerNo}
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nomor kontainer"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Seal{" "}
                {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <p className="text-gray-900">{inspection?.container.sealNo}</p>
              ) : (
                <input
                  type="text"
                  name="sealNo"
                  required
                  defaultValue={inspection?.container.sealNo}
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nomor seal"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Plat{" "}
                {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <p className="text-gray-900">{inspection?.container.plateNo}</p>
              ) : (
                <input
                  type="text"
                  name="plateNo"
                  required
                  defaultValue={inspection?.container.plateNo}
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nomor plat"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Pemeriksaan{" "}
                {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <p className="text-gray-900">
                  {inspection?.inspectionDate
                    ? formatDate(inspection.inspectionDate)
                    : "-"}
                </p>
              ) : (
                <input
                  type="datetime-local"
                  name="inspectionDate"
                  required
                  defaultValue={
                    inspection?.inspectionDate
                      ? formatDatetime(inspection.inspectionDate)
                      : ""
                  }
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Pemeriksa{" "}
                {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <p className="text-gray-900">{inspection?.inspectorName}</p>
              ) : (
                <select
                  name="inspectorName"
                  required
                  defaultValue={inspection?.inspectorName || ""}
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Pilih Nama Pemeriksa --</option>
                  {inspectorNames.map((inspector) => (
                    <option key={inspector.id} value={inspector.name}>
                      {inspector.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catatan Umum
            </label>
            {isViewMode ? (
              <p className="text-gray-900">{inspection?.remarks || "-"}</p>
            ) : (
              <textarea
                name="remarks"
                rows={3}
                defaultValue={inspection?.remarks || ""}
                className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Catatan tambahan (opsional)"
              />
            )}
          </div>
        </div>

        {/* Checklist Categories */}
        {sortedCategories.map((category, categoryIndex) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-sm p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {categoryIndex + 1}. {category.name}
            </h2>
            {category.description && (
              <p className="text-sm text-slate-600 mb-4">
                {category.description}
              </p>
            )}

            <div className="space-y-4">
              {category.items
                .sort((a, b) => a.order - b.order)
                .map((item, itemIndex) => {
                  const response = responseMap[item.id];
                  // TAMBAH: Sort history by date descending (terbaru di atas)
                  const itemHistory = (response?.history || []).sort(
                    (a, b) =>
                      new Date(b.changedAt).getTime() -
                      new Date(a.changedAt).getTime()
                  );

                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {itemIndex + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {item.itemText}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-slate-600 mb-3">
                              {item.description}
                            </p>
                          )}

                          {isViewMode ? (
                            <>
                              {response?.checked ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                  <Check className="w-4 h-4" />
                                  Diperiksa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                                  <X className="w-4 h-4" />
                                  Belum Diperiksa
                                </span>
                              )}

                              {response?.notes && (
                                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-sm font-semibold text-blue-900 mb-1">
                                    Catatan:
                                  </p>
                                  <p className="text-sm text-black">
                                    {response.notes}
                                  </p>
                                </div>
                              )}

                              {/* TAMBAHKAN: History Section */}
                              {itemHistory.length > 0 && (
                                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <History className="w-4 h-4 text-slate-600" />
                                    <p className="text-sm font-semibold text-slate-700">
                                      Riwayat Perubahan
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    {itemHistory.map((hist, idx) => (
                                      <div
                                        key={hist.id}
                                        className="bg-white border border-slate-200 rounded p-2 text-xs"
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-slate-700">
                                            Perubahan ke-
                                            {itemHistory.length - idx}
                                          </span>
                                          <span className="text-slate-500">
                                            {formatHistoryDate(hist.changedAt)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                          {hist.checked ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                              <Check className="w-3 h-3" />
                                              Diperiksa
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                              <X className="w-3 h-3" />
                                              Belum Diperiksa
                                            </span>
                                          )}
                                          <span className="text-slate-600">
                                            oleh {inspection?.inspectorName}
                                          </span>
                                        </div>
                                        {hist.notes && (
                                          <p className="text-black bg-slate-50 p-2 rounded">
                                            {hist.notes}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <input
                                  type="checkbox"
                                  id={`checklist-${item.id}`}
                                  name={`checklist-${item.id}`}
                                  defaultChecked={response?.checked || false}
                                  disabled={isPending}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label
                                  htmlFor={`checklist-${item.id}`}
                                  className="text-sm font-medium text-slate-700 cursor-pointer"
                                >
                                  Diperiksa
                                </label>
                              </div>

                              <div>
                                <label
                                  htmlFor={`notes-${item.id}`}
                                  className="block text-sm font-medium text-slate-700 mb-2"
                                >
                                  Catatan / Keterangan:
                                </label>
                                <textarea
                                  id={`notes-${item.id}`}
                                  name={`notes-${item.id}`}
                                  rows={2}
                                  defaultValue={response?.notes || ""}
                                  disabled={isPending}
                                  placeholder="Tambahkan catatan jika diperlukan..."
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm text-black"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {isEditMode && inspection && inspection.photos.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Foto Pemeriksaan Saat Ini
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inspection.photos.map((photo) => {
                const isDeleted = deletedPhotoIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    className={`relative group ${
                      isDeleted ? "opacity-50 grayscale" : ""
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-40 object-cover rounded-lg"
                    />
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
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Total foto saat ini: {remainingPhotos.length}{" "}
              {remainingPhotos.length === 0 ? "(akan dihapus semua)" : ""}
            </p>
          </div>
        )}

        {isViewMode && inspection && inspection.photos.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Foto Pemeriksaan
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inspection.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Total foto: {inspection.photos.length}
            </p>
          </div>
        )}

        {isViewMode && (!inspection || inspection.photos.length === 0) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Tidak ada foto untuk pemeriksaan ini
            </p>
          </div>
        )}

        {!isViewMode && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {isEditMode && inspection?.photos.length
                ? "Tambah Foto Pemeriksaan"
                : "Upload Foto Pemeriksaan"}
            </h2>
            <ImageUploadClientUnified />
          </div>
        )}

        <div className="flex gap-3">
          {!isViewMode ? (
            <>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`${inspection?.id}/edit`}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
              >
                Edit Pemeriksaan
              </Link>
              <Link
                href={backLink}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Kembali
              </Link>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
