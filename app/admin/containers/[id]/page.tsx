import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Calendar,
  FileText,
  ImageIcon,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Shield,
  ClipboardCheck,
  Building2,
  Truck,
  Clock,
  AlertCircle,
  Check,
} from "lucide-react";

interface HistoryItem {
  id: string;
  checked: boolean;
  notes: string | null;
  changedAt: Date;
  user: { name: string } | null;
}

interface ChecklistResponseItem {
  id: string;
  checked: boolean;
  notes: string | null;
  checklistItem: {
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
  };
  history: HistoryItem[];
}

interface VehicleResponseItem {
  id: string;
  checked: boolean;
  notes: string | null;
  vehicleInspectionItem: {
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
  };
  history: HistoryItem[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function ChecklistItemWithHistory({
  itemText,
  notes,
  checked,
  history,
}: {
  itemText: string;
  notes: string | null;
  checked: boolean;
  history: HistoryItem[];
  securityInspectorName: string;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <p className="font-medium text-gray-900 flex-1">{itemText}</p>
        {checked ? (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle2 size={16} />
            OK
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            <XCircle size={16} />
            NOT OK
          </span>
        )}
      </div>

      {notes && (
        <div className="mt-3 bg-white p-3 rounded border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Catatan Security:
          </p>
          <p className="text-sm text-gray-600">{notes}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Riwayat Perubahan:
          </p>
          <div className="space-y-2">
            {history.map((hist) => (
              <div
                key={hist.id}
                className="bg-blue-50 p-2 rounded text-xs border border-blue-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-blue-700">
                    {hist.checked ? "OK" : "NOT OK"}
                  </span>
                  <span className="text-gray-600">
                    {new Date(hist.changedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {hist.notes && (
                  <p className="text-gray-700 bg-white p-1 rounded mb-1">
                    &quot;{hist.notes}&quot;
                  </p>
                )}
                {hist.user && (
                  <p className="text-gray-600">oleh: {hist.user.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleItemWithHistory({
  itemName,
  standard,
  notes,
  history,
}: {
  itemName: string;
  standard: string;
  notes: string | null;
  checked: boolean;
  history: HistoryItem[];
  securityInspectorName: string;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="mb-2">
        <p className="font-medium text-gray-900">{itemName}</p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-semibold">Standard:</span> {standard}
        </p>
      </div>

      <div className="flex gap-2 mb-3">
        {notes?.includes("VISUAL") && (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            <Check size={16} />
            VISUAL
          </span>
        )}
        {notes?.includes("FUNCTION") && (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <Check size={16} />
            FUNCTION
          </span>
        )}
        {!notes && (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
            Belum Diperiksa
          </span>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Riwayat Perubahan:
          </p>
          <div className="space-y-2">
            {history.map((hist) => (
              <div
                key={hist.id}
                className="bg-blue-50 p-2 rounded text-xs border border-blue-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex gap-1">
                    {hist.notes?.includes("VISUAL") && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        VISUAL
                      </span>
                    )}
                    {hist.notes?.includes("FUNCTION") && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                        FUNCTION
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600">
                    {new Date(hist.changedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {hist.user && (
                  <p className="text-gray-600">oleh: {hist.user.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function AdminContainerDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const resolvedParams = await params;

  const container = await prisma.container.findUnique({
    where: { id: resolvedParams.id },
    include: {
      securityCheck: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
          photos: true,
          responses: {
            include: {
              checklistItem: {
                include: {
                  category: true,
                },
              },
              vehicleInspectionItem: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      },
      checkerData: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
          photos: true,
        },
      },
    },
  });

  if (!container) {
    redirect("/admin/containers");
  }

  const allHistories = container.securityCheck
    ? await prisma.securityCheckResponseHistory.findMany({
        where: {
          securityCheckId: container.securityCheck.id,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          changedAt: "desc",
        },
      })
    : [];

  const historyByChecklistItem = new Map();
  const historyByVehicleItem = new Map();

  allHistories.forEach((history) => {
    if (history.checklistItemId) {
      const existing =
        historyByChecklistItem.get(history.checklistItemId) || [];
      existing.push(history);
      historyByChecklistItem.set(history.checklistItemId, existing);
    }

    if (history.vehicleInspectionItemId) {
      const existing =
        historyByVehicleItem.get(history.vehicleInspectionItemId) || [];
      existing.push(history);
      historyByVehicleItem.set(history.vehicleInspectionItemId, existing);
    }
  });

  const checklistResponses: ChecklistResponseItem[] = container.securityCheck
    ? container.securityCheck.responses
        .filter((r) => r.checklistItemId)
        .map((response) => ({
          ...response,
          checklistItem: response.checklistItem!,
          history: historyByChecklistItem.get(response.checklistItemId!) || [],
        }))
    : [];

  const vehicleResponses: VehicleResponseItem[] = container.securityCheck
    ? container.securityCheck.responses
        .filter((r) => r.vehicleInspectionItemId)
        .map((response) => ({
          ...response,
          vehicleInspectionItem: response.vehicleInspectionItem!,
          history:
            historyByVehicleItem.get(response.vehicleInspectionItemId!) || [],
        }))
    : [];

  const checklistByCategory = checklistResponses.reduce(
    (acc, response) => {
      const category = response.checklistItem.category;
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
        category: ChecklistResponseItem["checklistItem"]["category"];
        responses: ChecklistResponseItem[];
      }
    >
  );

  const vehicleByCategory = vehicleResponses.reduce(
    (acc, response) => {
      const category = response.vehicleInspectionItem.category;
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
        category: VehicleResponseItem["vehicleInspectionItem"]["category"];
        responses: VehicleResponseItem[];
      }
    >
  );

  const securityCheck = container.securityCheck;
  const checkerData = container.checkerData;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href="/admin/containers"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Kembali ke Daftar Container
            </Link>

            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-blue-600" size={32} />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    Detail Container
                  </h1>
                  <p className="text-gray-600">
                    {container.containerNo} - {container.companyName}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                {securityCheck ? (
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                    <Shield size={16} />
                    Security: Selesai
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                    <AlertCircle size={16} />
                    Security: Belum
                  </span>
                )}

                {checkerData ? (
                  <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                    <ClipboardCheck size={16} />
                    Checker: Selesai
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                    <AlertCircle size={16} />
                    Checker: Belum
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Building2 size={24} />
              Informasi Kontainer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Calendar size={16} className="text-gray-600" />
                  {formatDate(container.inspectionDate)}
                </p>
              </div>
              {securityCheck && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pemeriksa Security
                  </label>
                  <p className="text-gray-900 font-medium">
                    {securityCheck.inspectorName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {securityCheck ? (
            <>
              {Object.keys(vehicleByCategory).length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Truck size={24} />
                    Vehicle Inspection Results
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Standar: PP/No.55/2012 & OSHA 29 CFR 1910
                  </p>

                  {Object.values(vehicleByCategory)
                    .sort((a, b) => a.category.order - b.category.order)
                    .map((cat, categoryIndex) => (
                      <div key={cat.category.id} className="mb-8 last:mb-0">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                          {categoryIndex + 1}. {cat.category.name}
                        </h3>
                        {cat.category.description && (
                          <p className="text-sm text-gray-600 mb-4 italic">
                            {cat.category.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cat.responses
                            .sort(
                              (a, b) =>
                                a.vehicleInspectionItem.order -
                                b.vehicleInspectionItem.order
                            )
                            .map((response) => (
                              <VehicleItemWithHistory
                                key={response.id}
                                itemName={
                                  response.vehicleInspectionItem.itemName
                                }
                                standard={
                                  response.vehicleInspectionItem.standard
                                }
                                notes={response.notes}
                                checked={response.checked}
                                history={response.history}
                                securityInspectorName={
                                  securityCheck.inspectorName
                                }
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Shield size={24} />
                  Hasil Pemeriksaan Security
                </h2>

                {Object.values(checklistByCategory)
                  .sort((a, b) => a.category.order - b.category.order)
                  .map((cat, categoryIndex) => (
                    <div key={cat.category.id} className="mb-8 last:mb-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                        {categoryIndex + 1}. {cat.category.name}
                      </h3>
                      {cat.category.description && (
                        <p className="text-sm text-gray-600 mb-4 italic">
                          {cat.category.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cat.responses
                          .sort(
                            (a, b) =>
                              a.checklistItem.order - b.checklistItem.order
                          )
                          .map((response) => (
                            <ChecklistItemWithHistory
                              key={response.id}
                              itemText={response.checklistItem.itemText}
                              notes={response.notes}
                              checked={response.checked}
                              history={response.history}
                              securityInspectorName={
                                securityCheck.inspectorName
                              }
                            />
                          ))}
                      </div>
                    </div>
                  ))}

                {securityCheck.remarks && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText size={16} />
                      Catatan Keseluruhan:
                    </p>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {securityCheck.remarks}
                    </p>
                  </div>
                )}
              </div>

              {securityCheck.photos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <ImageIcon size={24} />
                    Foto Security Inspection ({securityCheck.photos.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {securityCheck.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors group"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.filename}
                          width={300}
                          height={300}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 transition-all flex items-center justify-center">
                          <a
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded text-sm font-medium"
                          >
                            Lihat
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="text-yellow-600 flex-shrink-0 mt-1"
                  size={24}
                />
                <div>
                  <h3 className="text-lg font-bold text-yellow-800 mb-2">
                    Security belum melakukan pemeriksaan
                  </h3>
                  <p className="text-yellow-700">
                    Container ini belum diperiksa oleh Security.
                  </p>
                </div>
              </div>
            </div>
          )}

          {checkerData ? (
            <>
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <ClipboardCheck size={24} />
                  Data Checker
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Inspector Checker
                    </label>
                    <p className="text-gray-900 font-medium">
                      {checkerData.inspectorName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      No. UTC
                    </label>
                    <p className="text-gray-900 font-medium">
                      {checkerData.utcNo}
                    </p>
                  </div>
                  <div>
                    <label className=" text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock size={16} />
                      Waktu Input
                    </label>
                    <p className="text-gray-900 font-medium">
                      {formatDate(checkerData.createdAt)}
                    </p>
                  </div>
                </div>
                {checkerData.remarks && (
                  <div className="mt-6">
                    <label className=" text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText size={16} />
                      Catatan
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {checkerData.remarks}
                    </p>
                  </div>
                )}
              </div>

              {checkerData.photos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <ImageIcon size={24} />
                    Foto Checker ({checkerData.photos.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {checkerData.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors group"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.filename}
                          width={300}
                          height={300}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 transition-all flex items-center justify-center">
                          <a
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded text-sm font-medium"
                          >
                            Lihat
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="text-blue-600 flex-shrink-0 mt-1"
                  size={24}
                />
                <div>
                  <h3 className="text-lg font-bold text-blue-800 mb-2">
                    Checker belum melakukan pemeriksaan
                  </h3>
                  <p className="text-blue-700">
                    Container ini belum diperiksa oleh Checker.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
