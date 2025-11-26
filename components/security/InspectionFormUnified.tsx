"use client";

import { useTransition, useState, useRef } from "react";
import { toast } from "sonner";
import { createInspection, updateInspection } from "@/app/actions/inspections";
import { ArrowLeft, Check, History, Trash2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  checklistItemId: string | null;
  vehicleInspectionItemId: string | null;
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

interface VehicleInspectionItem {
  id: string;
  itemName: string;
  standard: string;
  order: number;
}

interface VehicleCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  items: VehicleInspectionItem[];
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
  vehicleCategories: VehicleCategory[];
  inspection?: Inspection;
  defaultInspectorName?: string;
  backLink?: string;
  userRole: "SECURITY" | "CHECKER";
  inspectorNames: InspectorName[];
}

export default function InspectionFormUnified({
  mode,
  categories,
  vehicleCategories,
  inspection,
  backLink = "/security/dashboard",
  inspectorNames,
}: InspectionFormUnifiedProps) {
  const [isPending, startTransition] = useTransition();
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const [vehicleInspection, setVehicleInspection] = useState<{
    [key: string]: { visual: boolean; function: boolean };
  }>(() => {
    const initial: { [key: string]: { visual: boolean; function: boolean } } =
      {};

    vehicleCategories.forEach((category) => {
      category.items.forEach((item) => {
        initial[item.id] = { visual: false, function: false };
      });
    });

    if (inspection?.responses) {
      inspection.responses.forEach((response) => {
        if (response.vehicleInspectionItemId && response.notes) {
          const checks = response.notes.split(",");
          initial[response.vehicleInspectionItemId] = {
            visual: checks.includes("VISUAL"),
            function: checks.includes("FUNCTION"),
          };
        }
      });
    }

    return initial;
  });

  const handleVehicleCheckChange = (
    itemId: string,
    type: "visual" | "function"
  ) => {
    setVehicleInspection((prev) => ({
      ...prev,
      [itemId]: {
        visual:
          type === "visual"
            ? !(prev[itemId]?.visual ?? false)
            : prev[itemId]?.visual ?? false,
        function:
          type === "function"
            ? !(prev[itemId]?.function ?? false)
            : prev[itemId]?.function ?? false,
      },
    }));
  };

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

    Object.entries(vehicleInspection).forEach(([itemId, checks]) => {
      const values = [];
      if (checks.visual) values.push("VISUAL");
      if (checks.function) values.push("FUNCTION");
      if (values.length > 0) {
        formData.append(`vehicle-${itemId}`, values.join(","));
      }
    });

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
      if (response.checklistItemId) {
        acc[response.checklistItemId] = response;
      }
      return acc;
    },
    {} as ResponseMap
  );

  const vehicleResponseMap = (inspection?.responses || []).reduce(
    (acc: ResponseMap, response) => {
      if (response.vehicleInspectionItemId) {
        acc[response.vehicleInspectionItemId] = response;
      }
      return acc;
    },
    {} as ResponseMap
  );

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const sortedVehicleCategories = [...vehicleCategories].sort(
    (a, b) => a.order - b.order
  );

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Kembali
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {title}
          </h1>
          <p className="text-gray-600">{subtitle}</p>

          {isViewMode && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  Progress Pemeriksaan
                </span>
                <span className="text-sm text-gray-600">
                  {checkedItems} dari {totalItems} item tercentang
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      totalItems > 0
                        ? ((checkedItems / totalItems) * 100).toFixed(0)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="text-right mt-2 text-lg font-bold text-blue-600">
                {totalItems > 0
                  ? ((checkedItems / totalItems) * 100).toFixed(0)
                  : 0}
                %
              </div>
            </div>
          )}
        </div>

        <form
          key={formKey}
          ref={formRef}
          action={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Informasi Kontainer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Perusahaan
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-gray-900 font-medium">
                    {inspection?.container.companyName}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="companyName"
                    defaultValue={inspection?.container.companyName}
                    required
                    placeholder="Nama Perusahaan"
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Kontainer{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-gray-900 font-medium">
                    {inspection?.container.containerNo}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="containerNo"
                    defaultValue={inspection?.container.containerNo}
                    required
                    placeholder="Nomor Kontainer"
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Seal{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-gray-900 font-medium">
                    {inspection?.container.sealNo}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="sealNo"
                    defaultValue={inspection?.container.sealNo}
                    required
                    placeholder="Nomor Seal"
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Plat{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-gray-900 font-medium">
                    {inspection?.container.plateNo}
                  </p>
                ) : (
                  <input
                    type="text"
                    name="plateNo"
                    defaultValue={inspection?.container.plateNo}
                    required
                    placeholder="Nomor Plat"
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Pemeriksaan{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-gray-900 font-medium">
                    {inspection?.inspectionDate
                      ? formatDate(inspection.inspectionDate)
                      : "-"}
                  </p>
                ) : (
                  <input
                    type="datetime-local"
                    name="inspectionDate"
                    defaultValue={
                      inspection?.inspectionDate
                        ? formatDatetime(inspection.inspectionDate)
                        : formatDatetime(new Date())
                    }
                    required
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Pemeriksa{" "}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <p className="text-gray-900 font-medium">
                    {inspection?.inspectorName}
                  </p>
                ) : (
                  <select
                    name="inspectorName"
                    defaultValue={inspection?.inspectorName}
                    required
                    className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catatan Umum
              </label>
              {isViewMode ? (
                <p className="text-gray-900">{inspection?.remarks || "-"}</p>
              ) : (
                <textarea
                  name="remarks"
                  defaultValue={inspection?.remarks || ""}
                  rows={3}
                  className="w-full border-2 border-gray-300 rounded-lg text-black px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Tambahkan catatan umum (opsional)"
                />
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Vehicle Inspection (Pemeriksaan Kendaraan)
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Standar: PP/No.55/2012 & OSHA 29 CFR 1910
            </p>

            {sortedVehicleCategories.map((category, categoryIndex) => (
              <div key={category.id} className="mb-8 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">
                  {categoryIndex + 1}. {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4 italic">
                    {category.description}
                  </p>
                )}

                <div className="space-y-4">
                  {category.items
                    .sort((a, b) => a.order - b.order)
                    .map((item, itemIndex) => {
                      const response = vehicleResponseMap[item.id];
                      const currentChecks = vehicleInspection[item.id] ?? {
                        visual: false,
                        function: false,
                      };

                      return (
                        <div
                          key={item.id}
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

                          {isViewMode ? (
                            <div className="mt-3 ml-8 flex gap-2">
                              {response?.notes?.includes("VISUAL") && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                  <Check size={16} />
                                  VISUAL
                                </span>
                              )}
                              {response?.notes?.includes("FUNCTION") && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                  <Check size={16} />
                                  FUNCTION
                                </span>
                              )}
                              {!response?.notes && (
                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                                  Belum Diperiksa
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 ml-8 flex gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentChecks.visual}
                                  onChange={() =>
                                    handleVehicleCheckChange(item.id, "visual")
                                  }
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  VISUAL
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentChecks.function}
                                  onChange={() =>
                                    handleVehicleCheckChange(
                                      item.id,
                                      "function"
                                    )
                                  }
                                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  FUNCTION
                                </span>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {sortedCategories.map((category, categoryIndex) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                {categoryIndex + 1}. {category.name}
              </h2>
              {category.description && (
                <p className="text-sm text-gray-600 mb-4 italic">
                  {category.description}
                </p>
              )}

              <div className="space-y-4">
                {category.items
                  .sort((a, b) => a.order - b.order)
                  .map((item, itemIndex) => {
                    const response = responseMap[item.id];
                    const itemHistory = (response?.history || []).sort(
                      (a, b) =>
                        new Date(b.changedAt).getTime() -
                        new Date(a.changedAt).getTime()
                    );

                    return (
                      <div
                        key={item.id}
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

                        {isViewMode ? (
                          <>
                            <div className="mt-3 ml-8">
                              {response?.checked ? (
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

                              {response?.notes && (
                                <div className="mt-3 bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-sm font-semibold text-gray-700 mb-1">
                                    Catatan:
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
                                            Perubahan ke-
                                            {itemHistory.length - idx}
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
                                          oleh {inspection?.inspectorName}
                                        </p>
                                        {hist.notes && (
                                          <p className="text-xs text-gray-700 mt-2 bg-white p-2 rounded">
                                            {hist.notes}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mt-3 ml-8">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  name={`checklist-${item.id}`}
                                  defaultChecked={response?.checked}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  Diperiksa
                                </span>
                              </label>
                              <label className="block mt-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Catatan / Keterangan:
                                </span>
                                <textarea
                                  name={`notes-${item.id}`}
                                  defaultValue={response?.notes || ""}
                                  rows={2}
                                  className="mt-1 w-full border border-gray-300 rounded-lg text-black px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Tambahkan catatan (opsional)"
                                />
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          {isEditMode && inspection && inspection.photos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Foto Pemeriksaan Saat Ini
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {inspection.photos.map((photo) => {
                  const isDeleted = deletedPhotoIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      className={`relative rounded-lg overflow-hidden border-2 ${
                        isDeleted
                          ? "border-red-300 opacity-50"
                          : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.filename}
                        width={300}
                        height={192}
                        className={`w-full h-48 object-cover rounded-lg transition ${
                          isDeleted ? "opacity-30 grayscale" : ""
                        }`}
                        unoptimized
                      />
                      {isDeleted ? (
                        <button
                          type="button"
                          onClick={() => handleUndoDeletePhoto(photo.id)}
                          className="absolute bottom-2 left-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition"
                        >
                          Batalkan Hapus
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition shadow-lg"
                        >
                          <Trash2 size={16} />
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
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Foto Pemeriksaan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {inspection.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative rounded-lg overflow-hidden border-2 border-gray-200"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.filename}
                      width={300}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg shadow-md"
                      unoptimized
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
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center text-gray-500">
              Tidak ada foto untuk pemeriksaan ini
            </div>
          )}

          {!isViewMode && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {isEditMode && inspection?.photos.length
                  ? "Tambah Foto Pemeriksaan"
                  : "Upload Foto Pemeriksaan"}
              </h2>
              <ImageUploadClientUnified />
            </div>
          )}

          <div className="flex gap-4">
            {!isViewMode ? (
              <>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                  className="px-6 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Batal
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/security/inspection/${inspection?.id}/edit`}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 text-center shadow-lg"
                >
                  Edit Pemeriksaan
                </Link>
                <Link
                  href={backLink}
                  className="px-6 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
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
