"use client";

import { useTransition, useRef } from "react";
import { toast } from "sonner";
import { submitCheckerData, updateCheckerData } from "@/app/actions/checker";
import {
  ArrowLeft,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  Package,
  Shield,
  Camera,
} from "lucide-react";
import Link from "next/link";
import ImageUploadClientUnified from "@/components/checker/ImageUploadClientUnified";

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
  checklistItem: {
    id: string;
    itemText: string;
    description: string | null;
    category: {
      id: string;
      name: string;
      description: string | null;
    };
  };
  history?: ResponseHistory[];
}

interface SecurityCheck {
  id: string;
  inspectionDate: Date;
  inspectorName: string;
  remarks: string | null;
  user?: {
    name: string;
  };
  photos: Photo[];
  responses: SecurityCheckResponse[];
}

interface Container {
  id: string;
  containerNo: string;
  companyName: string;
  sealNo: string;
  plateNo: string;
  inspectionDate: Date;
}

interface CheckerData {
  id: string;
  utcNo: string;
  inspectorName: string;
  remarks: string | null;
  user?: {
    name: string;
  };
  photos: Photo[];
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
  securityInspectorName?: string; // ✅ TAMBAH INI
}

export default function CheckerFormUnified({
  mode,
  container,
  securityCheck,
  checkerData,
  inspectorNames,
  securityInspectorName, // ✅ TAMBAH INI
}: CheckerFormUnifiedProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const allSecurityChecked = securityCheck.responses.every((r) => r.checked);
  const uncheckedCount = securityCheck.responses.filter(
    (r) => !r.checked
  ).length;
  const totalItems = securityCheck.responses.length;
  const checkedItems = totalItems - uncheckedCount;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatHistoryDate = (date: Date) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!allSecurityChecked) {
      toast.error(
        `Tidak dapat submit! Masih ada ${uncheckedCount} item yang belum diperiksa oleh Security.`
      );
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        if (mode === "create") {
          await submitCheckerData(container.id, formData);
          toast.success("Data berhasil disimpan!");
        } else if (mode === "edit" && checkerData) {
          await updateCheckerData(checkerData.id, formData);
          toast.success("Data berhasil diupdate!");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Terjadi kesalahan"
        );
      }
    });
  };

  const securityByCategory = securityCheck.responses.reduce((acc, response) => {
    const categoryId = response.checklistItem.category.id;
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category: response.checklistItem.category,
        responses: [],
      };
    }
    acc[categoryId].responses.push(response);
    return acc;
  }, {} as Record<string, { category: { id: string; name: string; description: string | null }; responses: SecurityCheckResponse[] }>);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {mode === "create" && "Pemeriksaan Checker"}
          {mode === "edit" && "Edit Pemeriksaan"}
          {mode === "view" && "Detail Pemeriksaan"}
        </h1>
        <p className="text-gray-600">
          {mode === "create" && "Input data pemeriksaan checker"}
          {mode === "edit" && "Edit data pemeriksaan checker"}
          {mode === "view" && "Lihat detail pemeriksaan checker"}
        </p>
      </div>

      {/* Alert - Security Items Not Checked */}
      {!allSecurityChecked && mode === "create" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">
              Tidak Dapat Melanjutkan Pemeriksaan
            </h3>
            <p className="text-sm text-red-700 mb-2">
              Masih ada{" "}
              <span className="font-bold">
                {uncheckedCount} dari {totalItems} item
              </span>{" "}
              yang belum diperiksa atau perlu perhatian dari Security. Checker
              tidak dapat input No. UTC dan upload gambar sampai semua item
              diperiksa.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full text-sm font-medium text-red-800">
              <XCircle className="h-4 w-4" />
              {checkedItems}/{totalItems}
            </div>
          </div>
        </div>
      )}

      {/* Success Progress */}
      {allSecurityChecked && mode === "create" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-800 mb-1">
              Semua Item Sudah Diperiksa
            </h3>
            <p className="text-sm text-green-700">
              Anda dapat melanjutkan ke input data checker
            </p>
          </div>
        </div>
      )}

      {/* Container Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Informasi Kontainer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Nomor Kontainer</p>
            <p className="text-lg font-semibold text-gray-800">
              {container.containerNo}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Nama Perusahaan</p>
            <p className="text-lg font-semibold text-gray-800">
              {container.companyName}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Nomor Seal</p>
            <p className="text-lg font-semibold text-gray-800">
              {container.sealNo}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Nomor Plat</p>
            <p className="text-lg font-semibold text-gray-800">
              {container.plateNo}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Tanggal Pemeriksaan
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {formatDate(container.inspectionDate)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Nama Pemeriksa</p>
            <p className="text-lg font-semibold text-gray-800">
              {securityInspectorName || "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Security Check Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Hasil Pemeriksaan Security
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {securityCheck.user?.name || "Unknown"}
        </p>

        {Object.values(securityByCategory).map((cat, categoryIndex) => (
          <div
            key={cat.category.id}
            className="mb-6 last:mb-0 pb-6 last:pb-0 border-b last:border-b-0 border-gray-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">
                {categoryIndex + 1}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {cat.category.name}
                </h3>
                {cat.category.description && (
                  <p className="text-sm text-gray-600">
                    {cat.category.description}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {cat.responses.map((response) => {
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
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {response.checked ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">
                          {response.checklistItem.itemText}
                        </p>
                        {response.checklistItem.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {response.checklistItem.description}
                          </p>
                        )}
                        {response.notes && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs font-semibold text-blue-800 mb-1">
                              Catatan Security
                            </p>
                            <p className="text-sm text-blue-900">
                              {response.notes}
                            </p>
                          </div>
                        )}

                        {/* ✅ HISTORY SECTION - GANTI hist.user.name dengan securityInspectorName */}
                        {itemHistory.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <History className="h-3 w-3" />
                              Riwayat Perubahan
                              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px]">
                                {itemHistory.length}
                              </span>
                            </p>
                            <div className="space-y-2">
                              {itemHistory.map((hist, idx) => (
                                <div
                                  key={hist.id}
                                  className="text-xs bg-white p-2 rounded border border-gray-200"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="font-medium text-gray-700">
                                      Perubahan #{itemHistory.length - idx}
                                    </span>
                                    <span className="text-gray-500 text-[10px]">
                                      {formatHistoryDate(hist.changedAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        hist.checked
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {hist.checked
                                        ? "✓ Diperiksa"
                                        : "✕ Belum Diperiksa"}
                                    </span>
                                    <span className="text-gray-600 text-[10px]">
                                      oleh {securityInspectorName || "Unknown"}
                                      {/* ✅ GANTI DARI hist.user.name KE securityInspectorName */}
                                    </span>
                                  </div>
                                  {hist.notes && (
                                    <p className="text-gray-600 text-[11px] italic">
                                      &quot;{hist.notes}&quot;
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            response.checked
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {response.checked ? "OK" : "Perlu Perhatian"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {securityCheck.remarks && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Catatan Umum Security:
            </p>
            <p className="text-sm text-blue-900">{securityCheck.remarks}</p>
          </div>
        )}

        {securityCheck.photos && securityCheck.photos.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Foto Pemeriksaan Security
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {securityCheck.photos.length}
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {securityCheck.photos.map((photo, index) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={`Security Photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {index + 1}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checker Data - View Mode */}
      {mode === "view" && checkerData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Data Pemeriksaan Checker
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Nama Inspector
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {checkerData.inspectorName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">No. UTC</p>
              <p className="text-lg font-semibold text-gray-800">
                {checkerData.utcNo}
              </p>
            </div>
          </div>
          {checkerData.remarks && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-semibold text-purple-800 mb-1">
                Catatan
              </p>
              <p className="text-sm text-purple-900">{checkerData.remarks}</p>
            </div>
          )}
          {checkerData.photos && checkerData.photos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Foto Checker
                <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {checkerData.photos.length}
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {checkerData.photos.map((photo, index) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt={`Checker Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                      {index + 1}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checker Data Form - Create/Edit Mode */}
      {mode !== "view" && (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Data Pemeriksaan Checker
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Inspector *
                </label>
                <select
                  name="inspectorName"
                  defaultValue={checkerData?.inspectorName || ""}
                  required
                  disabled={!allSecurityChecked}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                >
                  <option value="">Pilih Inspector</option>
                  {inspectorNames.map((inspector) => (
                    <option key={inspector.id} value={inspector.name}>
                      {inspector.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. UTC *
                </label>
                <input
                  type="text"
                  name="utcNo"
                  defaultValue={checkerData?.utcNo || ""}
                  required
                  disabled={!allSecurityChecked}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                  placeholder="Masukkan No. UTC"
                />
                {!allSecurityChecked && (
                  <p className="mt-1 text-xs text-red-600">
                    Input tidak dapat diisi karena ada item Security yang belum
                    diperiksa
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                name="remarks"
                defaultValue={checkerData?.remarks || ""}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                placeholder="Catatan tambahan (opsional)"
              />
            </div>

            <div>
              <ImageUploadClientUnified
                mode={mode}
                existingPhotos={checkerData?.photos || []}
                disabled={!allSecurityChecked}
              />
              {!allSecurityChecked && (
                <p className="mt-2 text-xs text-red-600">
                  Upload gambar tidak dapat dilakukan karena ada item Security
                  yang belum diperiksa
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/checker/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending || !allSecurityChecked}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isPending
                ? "Menyimpan..."
                : mode === "edit"
                ? "Update Data"
                : "Simpan Data"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
