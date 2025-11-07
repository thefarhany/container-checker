"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { submitCheckerData, deleteCheckerData } from "@/app/actions/checker";
import {
  ArrowLeft,
  Trash2,
  X,
  Check,
  Truck,
  QrCode,
  User,
  Camera,
  FileText,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import ImageUploadClientUnified from "@/components/checker/ImageUploadClientUnified";

type FormMode = "submit" | "view";

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
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

interface ChecklistItem {
  id: string;
  itemText: string;
  description: string | null;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SecurityCheck {
  id: string;
  remarks: string | null;
  photos: Photo[];
  responses: (SecurityCheckResponse & {
    checklistItem: ChecklistItem & {
      category: Category;
    };
  })[];
  user: {
    name: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface CheckerData {
  id: string;
  utcNo: string;
  remarks: string | null;
  createdAt: Date;
  userId: string;
  photos: Photo[];
}

interface Container {
  id: string;
  containerNo: string;
  companyName: string;
  sealNo: string;
  plateNo: string;
  inspectionDate: Date;
}

interface CheckerFormUnifiedProps {
  mode: FormMode;
  container: Container;
  securityCheck?: SecurityCheck | undefined;
  checkerData?: CheckerData;
  defaultCheckerName?: string;
  backLink?: string;
}

export default function CheckerFormUnified({
  mode,
  container,
  securityCheck,
  checkerData,
  defaultCheckerName = "",
  backLink = "/checker/dashboard",
}: CheckerFormUnifiedProps) {
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

  const getTitleAndSubtitle = () => {
    switch (mode) {
      case "submit":
        return {
          title: "Form Pemeriksaan Checker",
          subtitle:
            "Review hasil Security dan tambahkan nomor UTC & foto dokumentasi",
        };
      case "view":
        return {
          title: "Detail Pemeriksaan Checker",
          subtitle: `Diperiksa pada: ${
            checkerData?.createdAt ? formatDate(checkerData.createdAt) : "-"
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

  const handleDeleteCheckerData = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus pemeriksaan checker ini? Data tidak dapat dikembalikan."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const loadingToast = toast.loading("Menghapus pemeriksaan...", {
      description: "Mohon tunggu, sedang menghapus data dan foto",
    });

    const result = await deleteCheckerData(checkerData!.id);

    if (result.success) {
      toast.dismiss(loadingToast);
      toast.success("Pemeriksaan Berhasil Dihapus! ✓", {
        description: "Data pemeriksaan checker telah dihapus dari database",
        duration: 5000,
      });
      setTimeout(() => (window.location.href = backLink), 1500);
    } else {
      setIsDeleting(false);
      toast.dismiss(loadingToast);
      toast.error("Gagal Menghapus Pemeriksaan", {
        description: result.error || "Terjadi kesalahan",
        duration: 5000,
      });
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (mode === "view") return;

    const loadingToast = toast.loading("Menyimpan pemeriksaan checker...", {
      description: "Mohon tunggu, sedang mengupload foto dan menyimpan data",
    });

    startTransition(async () => {
      try {
        await submitCheckerData(container.id, formData);
        toast.dismiss(loadingToast);
        toast.success("Pemeriksaan Berhasil Disimpan! ✓", {
          description: "Data checker telah disimpan ke database",
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
          toast.success("Pemeriksaan Berhasil Disimpan! ✓", {
            duration: 5000,
          });
          throw error;
        }

        toast.dismiss(loadingToast);
        toast.error("Gagal Menyimpan Pemeriksaan", {
          description:
            error instanceof Error ? error.message : "Terjadi kesalahan",
          duration: 5000,
        });
      }
    });
  };

  const isSubmitMode = mode === "submit";
  const isViewMode = mode === "view";
  const currentPhotos = checkerData?.photos || [];
  const remainingPhotos = currentPhotos.filter(
    (photo) => !deletedPhotoIds.includes(photo.id)
  );

  const securityByCategory =
    securityCheck?.responses.reduce(
      (acc, response) => {
        const categoryId = response.checklistItem.category.id;
        if (!acc[categoryId]) {
          acc[categoryId] = {
            category: response.checklistItem.category,
            responses: [],
          };
        }
        acc[categoryId].responses.push(response);
        return acc;
      },
      {} as Record<
        string,
        {
          category: Category;
          responses: (SecurityCheckResponse & {
            checklistItem: ChecklistItem;
          })[];
        }
      >
    ) || {};

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
              <button
                onClick={handleDeleteCheckerData}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            )}
          </div>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Informasi Kontainer
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nomor Kontainer
                </label>
                <div className="flex items-center gap-2 text-slate-900 font-mono">
                  <QrCode className="w-4 h-4 text-slate-600" />
                  {container.containerNo}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Perusahaan
                </label>
                <p className="text-slate-900">{container.companyName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nomor Seal
                </label>
                <p className="text-slate-900 font-mono">{container.sealNo}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nomor Plat
                </label>
                <p className="text-slate-900 font-mono">{container.plateNo}</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal Pemeriksaan
                </label>
                <div className="flex items-center gap-2 text-slate-900">
                  <Clock className="w-4 h-4 text-slate-600" />
                  {formatDate(container.inspectionDate)}
                </div>
              </div>
            </div>
          </div>

          {securityCheck && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Hasil Pemeriksaan Security
              </h2>

              <div className="mb-6 pb-6 border-b border-blue-200">
                <p className="text-sm text-slate-700">
                  Diperiksa oleh:{" "}
                  <span className="font-semibold text-slate-900">
                    {securityCheck.user?.name || "Unknown"}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                {Object.values(securityByCategory).map((cat) => (
                  <div
                    key={cat.category.id}
                    className="bg-white rounded-lg border border-blue-200 p-4"
                  >
                    <h3 className="text-base font-semibold text-slate-900 mb-4">
                      {cat.category.name}
                    </h3>

                    <div className="space-y-3">
                      {cat.responses.map((response) => (
                        <div
                          key={response.id}
                          className="flex items-start gap-3 pb-3 last:pb-0 last:border-0 border-b border-slate-200 last:border-slate-200"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {response.checked ? (
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {response.checklistItem.itemText}
                            </p>
                            {response.checklistItem.description && (
                              <p className="text-xs text-slate-600 mt-1">
                                {response.checklistItem.description}
                              </p>
                            )}
                            {response.notes && (
                              <div className="mt-2 bg-slate-50 border border-slate-200 rounded p-2">
                                <p className="text-xs font-medium text-slate-700 mb-1">
                                  Catatan:
                                </p>
                                <p className="text-xs text-slate-600 whitespace-pre-wrap">
                                  {response.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0">
                            {response.checked ? (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                <Check className="w-3 h-3" />
                                OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Perlu Perhatian
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {securityCheck.remarks && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Catatan Umum Security:
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {securityCheck.remarks}
                    </p>
                  </div>
                </div>
              )}

              {securityCheck.photos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Foto Security ({securityCheck.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {securityCheck.photos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative rounded-lg overflow-hidden border border-blue-300 hover:shadow-lg transition"
                      >
                        <img
                          src={photo.url}
                          alt={photo.filename}
                          className="w-full h-24 object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                          <span className="text-white text-lg opacity-0 group-hover:opacity-100 transition">
                            ↗
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Informasi Checker
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nomor UTC{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-slate-900 font-mono">
                    {checkerData?.utcNo}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="utcNo"
                    required={!isViewMode}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                    placeholder="Contoh: UTC-2024-001"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Checker
                </label>
                {isViewMode ? (
                  <div className="flex items-center gap-2 text-slate-900">
                    <User className="w-4 h-4 text-slate-600" />
                    {defaultCheckerName}
                  </div>
                ) : (
                  <input
                    type="text"
                    name="checkerName"
                    disabled
                    defaultValue={defaultCheckerName}
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                    placeholder="Otomatis sesuai pengguna login"
                  />
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Catatan Checker (Opsional)
              </label>
              {isViewMode ? (
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {checkerData?.remarks || "-"}
                  </p>
                </div>
              ) : (
                <textarea
                  name="remarks"
                  rows={3}
                  disabled={isViewMode}
                  className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none disabled:bg-slate-100"
                  placeholder="Masukkan catatan tambahan (opsional)"
                />
              )}
            </div>
          </div>

          {isViewMode && checkerData && checkerData.photos.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Foto Pemeriksaan Checker ({remainingPhotos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {checkerData.photos.map((photo) => (
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
                    <div className="absolute inset-0 transition flex items-center justify-center">
                      <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition">
                        ↗
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {isViewMode && (!checkerData || checkerData.photos.length === 0) && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm text-center">
              <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">
                Tidak ada foto untuk pemeriksaan ini
              </p>
            </div>
          )}

          {isSubmitMode && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Upload Foto Pemeriksaan Checker
              </h2>
              <ImageUploadClientUnified mode="create" />
            </div>
          )}

          <div className="flex gap-3">
            {isSubmitMode ? (
              <>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  {isPending ? "Menyimpan..." : "Simpan Pemeriksaan"}
                </button>
                <Link
                  href={backLink}
                  className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </Link>
              </>
            ) : (
              <Link
                href={backLink}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
              >
                Kembali
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
