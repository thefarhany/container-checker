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
  User,
  Calendar,
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
}

export default function CheckerFormUnified({
  mode,
  container,
  securityCheck,
  checkerData,
  inspectorNames,
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
  }, {} as Record<string, { category: any; responses: typeof securityCheck.responses }>);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mx-auto max-w-5xl space-y-6 pb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/checker/dashboard"
            className="rounded-lg border border-gray-300 bg-white p-2 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "create" && "Pemeriksaan Checker"}
              {mode === "edit" && "Edit Pemeriksaan"}
              {mode === "view" && "Detail Pemeriksaan"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {mode === "create" && "Input data pemeriksaan checker"}
              {mode === "edit" && "Edit data pemeriksaan checker"}
              {mode === "view" && "Lihat detail pemeriksaan checker"}
            </p>
          </div>
        </div>
      </div>

      {/* Alert - Security Items Not Checked */}
      {!allSecurityChecked && mode === "create" && (
        <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-500 p-2">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900">
                Tidak Dapat Melanjutkan Pemeriksaan
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-red-800">
                Masih ada{" "}
                <span className="font-bold">
                  {uncheckedCount} dari {totalItems} item
                </span>{" "}
                yang belum diperiksa atau perlu perhatian dari Security. Checker
                tidak dapat input No. UTC dan upload gambar sampai semua item
                diperiksa.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-red-200">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{ width: `${(checkedItems / totalItems) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-red-900">
                  {checkedItems}/{totalItems}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Progress */}
      {allSecurityChecked && mode === "create" && (
        <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-500 p-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-900">
                Semua Item Sudah Diperiksa
              </p>
              <p className="text-sm text-green-700">
                Anda dapat melanjutkan ke input data checker
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Container Info Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Informasi Kontainer
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Nomor Kontainer
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {container.containerNo}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Nama Perusahaan
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {container.companyName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Nomor Seal
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {container.sealNo}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Nomor Plat
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {container.plateNo}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 md:col-span-2">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Tanggal Pemeriksaan
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {formatDate(container.inspectionDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Check Results */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Hasil Pemeriksaan Security
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1">
              <User className="h-4 w-4 text-emerald-700" />
              <span className="text-sm font-medium text-emerald-700">
                {securityCheck.user?.name || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {Object.values(securityByCategory).map((cat, categoryIndex) => (
            <div key={cat.category.id} className="space-y-4">
              {/* ✅ PERBAIKAN 1: Tambahkan Nomor Kategori */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-sm">
                  {categoryIndex + 1}
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {cat.category.name}
                </h3>
              </div>
              {cat.category.description && (
                <p className="text-sm text-gray-600 pl-11">
                  {cat.category.description}
                </p>
              )}

              <div className="space-y-3 pl-11">
                {cat.responses.map((response) => {
                  const itemHistory = (response.history || []).sort(
                    (a, b) =>
                      new Date(b.changedAt).getTime() -
                      new Date(a.changedAt).getTime()
                  );

                  return (
                    <div
                      key={response.id}
                      className="group overflow-hidden rounded-lg border-2 transition-all hover:border-gray-300 hover:shadow-md"
                      style={{
                        borderColor: response.checked ? "#d1fae5" : "#fee2e2",
                        backgroundColor: response.checked
                          ? "#f0fdf4"
                          : "#fef2f2",
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
                              response.checked
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {response.checked ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">
                              {response.checklistItem.itemText}
                            </p>
                            {response.checklistItem.description && (
                              <p className="mt-1 text-sm text-gray-600">
                                {response.checklistItem.description}
                              </p>
                            )}

                            {response.notes && (
                              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                                  Catatan Security
                                </p>
                                <p className="mt-1 text-sm text-blue-800">
                                  {response.notes}
                                </p>
                              </div>
                            )}

                            {itemHistory.length > 0 && (
                              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                  <History className="h-4 w-4 text-gray-500" />
                                  <span>Riwayat Perubahan</span>
                                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700">
                                    {itemHistory.length}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {itemHistory.map((hist, idx) => (
                                    <div
                                      key={hist.id}
                                      className="rounded-md border border-gray-200 bg-gray-50 p-3"
                                    >
                                      <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-900">
                                          Perubahan #{itemHistory.length - idx}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatHistoryDate(hist.changedAt)}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span
                                          className={`rounded-full px-2.5 py-1 font-semibold ${
                                            hist.checked
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {hist.checked
                                            ? "✓ Diperiksa"
                                            : "✕ Belum Diperiksa"}
                                        </span>
                                        <span className="text-gray-600">
                                          oleh {hist.user.name}
                                        </span>
                                      </div>
                                      {hist.notes && (
                                        <p className="mt-2 text-sm text-gray-700 italic">
                                          "{hist.notes}"
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <span
                            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                              response.checked
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
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
        </div>

        {securityCheck.remarks && (
          <div className="border-t border-gray-200 bg-amber-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Catatan Umum Security:
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {securityCheck.remarks}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ PERBAIKAN 2: Foto Bisa Diklik untuk Buka Tab Baru */}
        {securityCheck.photos && securityCheck.photos.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
            <div className="mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Foto Pemeriksaan Security
              </h3>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700">
                {securityCheck.photos.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {securityCheck.photos.map((photo, index) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-all hover:border-blue-400 hover:shadow-lg cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Overlay saat hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white rounded-full p-2">
                        <svg
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* Nomor foto di pojok kiri atas */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">
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
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Data Pemeriksaan Checker
              </h2>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Nama Inspector
                </p>
                <p className="mt-1 text-base font-bold text-gray-900">
                  {checkerData.inspectorName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  No. UTC
                </p>
                <p className="mt-1 text-base font-bold text-gray-900">
                  {checkerData.utcNo}
                </p>
              </div>
            </div>
            {checkerData.remarks && (
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Catatan
                  </p>
                  <p className="mt-1 text-base text-gray-900">
                    {checkerData.remarks}
                  </p>
                </div>
              </div>
            )}
            {checkerData.photos && checkerData.photos.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-bold text-gray-900">
                    Foto Checker
                  </p>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700">
                    {checkerData.photos.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {checkerData.photos.map((photo, index) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-lg cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {/* Overlay saat hover */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white rounded-full p-2">
                            <svg
                              className="h-5 w-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      {/* Nomor foto di pojok kiri atas */}
                      <div className="absolute top-2 left-2 bg-black/30 text-white text-xs font-bold px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checker Data Form - Create/Edit Mode */}
      {mode !== "view" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Data Pemeriksaan Checker
              </h2>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Nama Inspector <span className="text-red-500">*</span>
              </label>
              <select
                name="inspectorName"
                defaultValue={checkerData?.inspectorName}
                disabled={isPending}
                required
                className="w-full rounded-lg text-black border-2 border-gray-300 px-4 py-3 font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
              <label className="mb-2 block text-sm font-bold text-gray-700">
                No. UTC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="utcNo"
                defaultValue={checkerData?.utcNo}
                disabled={!allSecurityChecked || isPending}
                required
                className="w-full rounded-lg text-black border-2 border-gray-300 px-4 py-3 font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="Masukkan nomor UTC"
              />
              {!allSecurityChecked && (
                <p className="mt-2 flex items-center gap-2 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Input tidak dapat diisi karena ada item Security yang belum
                  diperiksa
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Catatan
              </label>
              <textarea
                name="remarks"
                defaultValue={checkerData?.remarks || ""}
                disabled={isPending}
                rows={4}
                className="w-full rounded-lg text-black border-2 border-gray-300 px-4 py-3 font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                placeholder="Catatan tambahan (opsional)"
              />
            </div>

            <ImageUploadClientUnified
              mode={mode}
              existingPhotos={checkerData?.photos || []}
              disabled={!allSecurityChecked}
            />

            {!allSecurityChecked && (
              <p className="flex items-center gap-2 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Upload gambar tidak dapat dilakukan karena ada item Security
                yang belum diperiksa
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {mode !== "view" && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/checker/dashboard"
            className="rounded-lg border-2 border-gray-300 bg-white px-6 py-2.5 font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending || !allSecurityChecked}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-2.5 font-bold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
          >
            {isPending
              ? "Menyimpan..."
              : mode === "edit"
              ? "Update Data"
              : "Simpan Data"}
          </button>
        </div>
      )}
    </form>
  );
}
