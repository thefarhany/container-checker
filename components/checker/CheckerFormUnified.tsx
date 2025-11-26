"use client";

import { useTransition, useState, useRef } from "react";
import { toast } from "sonner";
import { submitCheckerData } from "@/app/actions/checker";
import { ArrowLeft, Check, History, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import ImageUploadClientUnified from "@/components/checker/ImageUploadClientUnified";
import Image from "next/image";

type FormMode = "create" | "view";

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
  checklistItemId: string | null;
  vehicleInspectionItemId: string | null;
  checked: boolean;
  notes: string | null;
  checklistItem?: ChecklistItem;
  vehicleInspectionItem?: VehicleInspectionItem;
  history?: ResponseHistory[];
}

interface ChecklistItem {
  id: string;
  itemText: string;
  description: string | null;
  order: number;
  category: {
    id: string;
    name: string;
    description: string | null;
    order: number;
  };
}

interface VehicleInspectionItem {
  id: string;
  itemName: string;
  standard: string;
  order: number;
  category: {
    id: string;
    name: string;
    description: string | null;
    order: number;
  };
}

interface Container {
  id: string;
  companyName: string;
  containerNo: string;
  sealNo: string;
  plateNo: string;
  inspectionDate: Date;
}

interface SecurityCheck {
  id: string;
  userId: string;
  inspectorName: string;
  remarks: string | null;
  inspectionDate: Date;
  containerId: string;
  createdAt: Date;
  updatedAt: Date;
  photos: Photo[];
  responses: SecurityCheckResponse[];
  user?: {
    name: string;
  };
}

interface CheckerData {
  id: string;
  containerId: string;
  userId: string;
  inspectorName: string;
  utcNo: string;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: Photo[];
  user?: {
    name: string;
  };
}

interface InspectorName {
  id: string;
  name: string;
}

interface CheckerFormUnifiedProps {
  mode: FormMode;
  container: Container;
  securityCheck: SecurityCheck;
  checkerData?: CheckerData;
  inspectorNames: InspectorName[];
}

export default function CheckerFormUnified({
  mode,
  container,
  securityCheck,
  checkerData,
  inspectorNames,
}: CheckerFormUnifiedProps) {
  const [isPending, startTransition] = useTransition();
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

  const handleSubmit = async (formData: FormData) => {
    if (mode === "view") return;

    const loadingToast = toast.loading("Menyimpan data checker...", {
      description: "Mohon tunggu, sedang mengupload foto dan menyimpan data",
    });

    startTransition(async () => {
      try {
        await submitCheckerData(container.id, formData);

        toast.dismiss(loadingToast);
        toast.success("Data Checker Berhasil Disimpan! ✓", {
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
          toast.success("Data Checker Berhasil Disimpan! ✓", {
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

  const securityInspectorName = securityCheck.inspectorName;
  const uncheckedCount = securityCheck.responses.filter(
    (r) => !r.checked
  ).length;
  const totalItems = securityCheck.responses.length;
  const canProceed = uncheckedCount === 0;

  const isViewMode = mode === "view";

  const securityByCategory = securityCheck.responses
    .filter((r) => r.checklistItemId)
    .reduce((acc, response) => {
      const category = response.checklistItem?.category;
      if (!category) return acc;

      if (!acc[category.id]) {
        acc[category.id] = {
          category,
          responses: [],
        };
      }

      acc[category.id].responses.push(response);
      return acc;
    }, {} as Record<string, { category: ChecklistItem["category"]; responses: SecurityCheckResponse[] }>);

  const vehicleByCategory = securityCheck.responses
    .filter((r) => r.vehicleInspectionItemId)
    .reduce(
      (acc, response) => {
        const category = response.vehicleInspectionItem?.category;
        if (!category) return acc;

        if (!acc[category.id]) {
          acc[category.id] = {
            category,
            responses: [],
          };
        }

        acc[category.id].responses.push(response);
        return acc;
      },
      {} as Record<
        string,
        {
          category: VehicleInspectionItem["category"];
          responses: SecurityCheckResponse[];
        }
      >
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/checker/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Kembali ke Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {mode === "create" && "Input data pemeriksaan checker"}
            {mode === "view" && "Lihat detail pemeriksaan checker"}
          </h1>
        </div>

        {!canProceed && mode === "create" && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="text-yellow-600 flex-shrink-0 mt-1"
                size={24}
              />
              <div>
                <h3 className="text-lg font-bold text-yellow-800 mb-2">
                  Peringatan: Pemeriksaan Security Belum Lengkap
                </h3>
                <p className="text-yellow-700 mb-3">
                  Masih ada{" "}
                  <span className="font-bold text-yellow-900">
                    {uncheckedCount} dari {totalItems} item
                  </span>{" "}
                  yang belum diperiksa atau perlu perhatian dari Security.
                  Checker tidak dapat input No. UTC dan upload gambar sampai
                  semua item diperiksa.
                </p>
              </div>
            </div>
          </div>
        )}

        {canProceed && mode === "create" && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <Check className="text-green-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-bold text-green-800 mb-2">
                  Semua Item Telah Diperiksa Security
                </h3>
                <p className="text-green-700">
                  Anda dapat melanjutkan ke input data checker
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. INFORMASI KONTAINER */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Informasi Kontainer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Kontainer
              </label>
              <p className="text-gray-900 font-medium">
                {container.containerNo}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Perusahaan
              </label>
              <p className="text-gray-900 font-medium">
                {container.companyName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Seal
              </label>
              <p className="text-gray-900 font-medium">{container.sealNo}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Plat
              </label>
              <p className="text-gray-900 font-medium">{container.plateNo}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Pemeriksaan
              </label>
              <p className="text-gray-900 font-medium">
                {formatDate(container.inspectionDate)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Pemeriksa
              </label>
              <p className="text-gray-900 font-medium">
                {securityInspectorName || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* 2. VEHICLE INSPECTION RESULTS */}
        {Object.keys(vehicleByCategory).length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Vehicle Inspection Results (dari Security)
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Standar: PP/No.55/2012 & OSHA 29 CFR 1910
            </p>

            {Object.values(vehicleByCategory).map((cat, categoryIndex) => (
              <div key={cat.category.id} className="mb-8 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">
                  {categoryIndex + 1}. {cat.category.name}
                </h3>
                {cat.category.description && (
                  <p className="text-sm text-gray-600 mb-4 italic">
                    {cat.category.description}
                  </p>
                )}

                <div className="space-y-4">
                  {cat.responses
                    .sort(
                      (a, b) =>
                        (a.vehicleInspectionItem?.order || 0) -
                        (b.vehicleInspectionItem?.order || 0)
                    )
                    .map((response, itemIndex) => {
                      const item = response.vehicleInspectionItem;
                      if (!item) return null;

                      const itemHistory = (response.history || []).sort(
                        (a, b) =>
                          new Date(b.changedAt).getTime() -
                          new Date(a.changedAt).getTime()
                      );

                      return (
                        <div
                          key={response.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <span className="font-semibold text-gray-700 min-w-[2rem]">
                              {itemIndex + 1}.
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {item.itemName}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-semibold">Standard:</span>{" "}
                                {item.standard}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 ml-8 flex gap-2">
                            {response.notes?.includes("VISUAL") && (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                <Check size={16} />
                                VISUAL
                              </span>
                            )}
                            {response.notes?.includes("FUNCTION") && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                <Check size={16} />
                                FUNCTION
                              </span>
                            )}
                            {!response.notes && (
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                                Belum Diperiksa
                              </span>
                            )}
                          </div>

                          {itemHistory.length > 0 && (
                            <div className="mt-4 ml-8 border-t border-gray-200 pt-4">
                              <button
                                type="button"
                                className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-3"
                              >
                                <History size={16} />
                                Riwayat Perubahan
                              </button>
                              <div className="space-y-3">
                                {itemHistory.map((hist, idx) => (
                                  <div
                                    key={hist.id}
                                    className="bg-blue-50 p-3 rounded-lg border border-blue-200"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-blue-700">
                                        Perubahan ke-{itemHistory.length - idx}
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        {formatHistoryDate(hist.changedAt)}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                      {hist.notes?.includes("VISUAL") && (
                                        <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                          VISUAL
                                        </span>
                                      )}
                                      {hist.notes?.includes("FUNCTION") && (
                                        <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                          FUNCTION
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600">
                                      oleh{" "}
                                      {securityCheck.user?.name || "Unknown"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. CHECKLIST ITEMS */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Hasil Pemeriksaan Security
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Diperiksa oleh: {securityCheck.user?.name || "Unknown"}
          </p>

          {Object.values(securityByCategory).map((cat, categoryIndex) => (
            <div key={cat.category.id} className="mb-8 last:mb-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">
                {categoryIndex + 1}. {cat.category.name}
              </h3>
              {cat.category.description && (
                <p className="text-sm text-gray-600 mb-4 italic">
                  {cat.category.description}
                </p>
              )}

              <div className="space-y-4">
                {cat.responses
                  .sort(
                    (a, b) =>
                      (a.checklistItem?.order || 0) -
                      (b.checklistItem?.order || 0)
                  )
                  .map((response, itemIndex) => {
                    const item = response.checklistItem;
                    if (!item) return null;

                    const itemHistory = (response.history || []).sort(
                      (a, b) =>
                        new Date(b.changedAt).getTime() -
                        new Date(a.changedAt).getTime()
                    );

                    return (
                      <div
                        key={response.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <span className="font-semibold text-gray-700 min-w-[2rem]">
                            {itemIndex + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {item.itemText}
                            </p>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 ml-8">
                          {response.checked ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              <Check size={16} />
                              Diperiksa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                              <X size={16} />
                              Belum Diperiksa
                            </span>
                          )}

                          {response.notes && (
                            <div className="mt-3 bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-1">
                                Catatan Security:
                              </p>
                              <p className="text-sm text-gray-600">
                                {response.notes}
                              </p>
                            </div>
                          )}

                          {itemHistory.length > 0 && (
                            <div className="mt-4 border-t border-gray-200 pt-4">
                              <button
                                type="button"
                                className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-3"
                              >
                                <History size={16} />
                                Riwayat Perubahan
                              </button>
                              <div className="space-y-3">
                                {itemHistory.map((hist, idx) => (
                                  <div
                                    key={hist.id}
                                    className="bg-blue-50 p-3 rounded-lg border border-blue-200"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-blue-700">
                                        Perubahan ke-{itemHistory.length - idx}
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        {formatHistoryDate(hist.changedAt)}
                                      </span>
                                    </div>
                                    {hist.checked ? (
                                      <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium mb-2">
                                        Diperiksa
                                      </span>
                                    ) : (
                                      <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium mb-2">
                                        Belum Diperiksa
                                      </span>
                                    )}
                                    <p className="text-xs text-gray-600">
                                      oleh{" "}
                                      {securityCheck.user?.name || "Unknown"}
                                    </p>
                                    {hist.notes && (
                                      <p className="text-xs text-gray-700 mt-2 bg-white p-2 rounded">
                                        &quot;{hist.notes}&quot;
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          {securityCheck.remarks && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Catatan Umum Security:
              </p>
              <p className="text-gray-900">{securityCheck.remarks}</p>
            </div>
          )}
        </div>

        {/* 4. PHOTOS DARI SECURITY */}
        {securityCheck.photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Foto Security Inspection
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {securityCheck.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative rounded-lg overflow-hidden border-2 border-gray-200"
                >
                  <Image
                    src={photo.url}
                    alt={photo.filename}
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg shadow-md"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. CHECKER FORM (view mode) */}
        {isViewMode && checkerData && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Data Checker
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Inspector
                </label>
                <p className="text-gray-900 font-medium">
                  {checkerData.inspectorName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No. UTC
                </label>
                <p className="text-gray-900 font-medium">{checkerData.utcNo}</p>
              </div>
            </div>
            {checkerData.remarks && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan
                </label>
                <p className="text-gray-900">{checkerData.remarks}</p>
              </div>
            )}
          </div>
        )}

        {/* 6. UPLOAD CHECKER (view mode) */}
        {isViewMode && checkerData && checkerData.photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Foto Checker
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {checkerData.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative rounded-lg overflow-hidden border-2 border-gray-200"
                >
                  <Image
                    src={photo.url}
                    alt={photo.filename}
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg shadow-md"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5 & 6. CHECKER FORM + UPLOAD (create mode) */}
        {mode === "create" && canProceed && (
          <form
            key={formKey}
            ref={formRef}
            action={handleSubmit}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Input Data Checker
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Inspector <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="inspectorName"
                    required
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">-- Pilih Nama Inspector --</option>
                    {inspectorNames.map((inspector) => (
                      <option key={inspector.id} value={inspector.name}>
                        {inspector.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    No. UTC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="utcNo"
                    required
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Masukkan nomor UTC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan
                  </label>
                  <textarea
                    name="remarks"
                    rows={3}
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Tambahkan catatan (opsional)"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Upload Foto Checker
              </h2>
              <ImageUploadClientUnified mode="create" />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isPending ? "Menyimpan..." : "Simpan Data Checker"}
              </button>
              <Link
                href="/checker/dashboard"
                className="px-6 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Batal
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
