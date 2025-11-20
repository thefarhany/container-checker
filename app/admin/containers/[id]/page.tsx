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
} from "lucide-react";

interface HistoryItem {
  id: string;
  checked: boolean;
  notes: string | null;
  changedAt: Date;
  user: { name: string } | null;
}

interface ResponseItem {
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

interface PhotoItem {
  id: string;
  url: string;
  filename: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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
    <div className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {checked ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900">{itemText}</p>
            <span
              className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                checked
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {checked ? "OK" : "NOT OK"}
            </span>
          </div>

          {notes && (
            <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded">
              <p className="text-xs font-medium text-yellow-800">
                Catatan Security:
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">{notes}</p>
            </div>
          )}

          {history && history.length > 0 && (
            <details className="mt-2 group">
              <summary className="cursor-pointer text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Riwayat Perubahan
              </summary>
              <div className="mt-1 space-y-1 pl-4 border-l border-purple-200">
                {history.map((hist: HistoryItem, index: number) => (
                  <div
                    key={hist.id || index}
                    className="text-xs p-1.5 bg-white rounded"
                  >
                    <div className="flex items-center gap-1.5">
                      {hist.checked ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="font-medium text-gray-700">
                        {hist.checked ? "OK" : "NOT OK"}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        {new Date(hist.changedAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    {hist.notes && (
                      <p className="text-gray-600 mt-0.5 italic">
                        &quot;{hist.notes}&quot;
                      </p>
                    )}
                    {hist.user && (
                      <p className="text-gray-500 text-[10px] mt-0.5">
                        oleh: {hist.user.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function ContainerDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
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
            },
            orderBy: {
              checklistItem: {
                order: "asc",
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

  const { securityCheck, checkerData } = container;

  let responsesWithHistory: ResponseItem[] = [];
  let responsesByCategory: Record<string, ResponseItem[]> = {};

  if (securityCheck) {
    const allHistories = await prisma.securityCheckResponseHistory.findMany({
      where: {
        securityCheckId: securityCheck.id,
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
    });

    const historyByChecklistItem = new Map<string, HistoryItem[]>();
    allHistories.forEach((history) => {
      const existing =
        historyByChecklistItem.get(history.checklistItemId) || [];
      existing.push(history);
      historyByChecklistItem.set(history.checklistItemId, existing);
    });

    responsesWithHistory = securityCheck.responses.map((response) => ({
      ...response,
      history: historyByChecklistItem.get(response.checklistItemId) || [],
    }));

    responsesByCategory = responsesWithHistory.reduce((acc, response) => {
      const catId = response.checklistItem.category.id;
      if (!acc[catId]) {
        acc[catId] = [];
      }
      acc[catId].push(response);
      return acc;
    }, {} as Record<string, ResponseItem[]>);
  }

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/containers"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Kembali</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-7 w-7 text-purple-600" />
                Lihat detail dan riwayat pemeriksaan kontainer
              </h1>
            </div>
          </div>

          {/* Alert Messages */}
          {!securityCheck && !checkerData && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Security dan Checker belum melakukan pemeriksaan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {securityCheck && !checkerData && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Checker belum melakukan pemeriksaan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!securityCheck && checkerData && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Security belum melakukan pemeriksaan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Container Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Package className="h-6 w-6" />
                Informasi Kontainer
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nomor Kontainer
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {container.containerNo}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nama Perusahaan
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {container.companyName}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nomor Seal
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {container.sealNo}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nomor Plat
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {container.plateNo}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Tanggal Pemeriksaan
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(container.inspectionDate).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </div>
                </div>
              </div>

              {checkerData && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      No. UTC
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {checkerData.utcNo}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Check */}
          {securityCheck && (
            <details className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              <summary className="px-6 py-4 bg-green-600 cursor-pointer hover:bg-green-700 transition-colors flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Hasil Security Check oleh {securityCheck.inspectorName}
                </h2>
                <div className="text-white text-sm">
                  Diperiksa pada{" "}
                  {new Date(securityCheck.createdAt).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              </summary>

              <div className="p-6">
                {securityCheck.remarks && (
                  <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Catatan Keseluruhan:
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      {securityCheck.remarks}
                    </p>
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {responsesWithHistory.length} item pemeriksaan
                  </p>
                  <button
                    type="button"
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Klik untuk buka
                  </button>
                </div>

                <div className="space-y-6">
                  {/* ✅ FIX: Remove [string, any] - Let TypeScript infer */}
                  {Object.entries(responsesByCategory).map(
                    ([categoryName, responses], categoryIndex) => {
                      const category = responses[0]?.checklistItem.category;
                      return (
                        <div
                          key={categoryName}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-purple-50 flex items-center gap-3">
                            <span className="text-xl font-bold text-purple-600">
                              {categoryIndex + 1}
                            </span>
                            <div>
                              <h3 className="text-base font-semibold text-gray-900">
                                {category?.name}
                              </h3>
                              {category?.description && (
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-3 bg-white">
                            {/* ✅ FIX: Remove (response: any) - TypeScript knows type */}
                            {responses.map((response) => (
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
                      );
                    }
                  )}
                </div>

                {securityCheck.photos && securityCheck.photos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                      Foto Pemeriksaan Security ({securityCheck.photos.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {/* ✅ FIX: Remove (photo: any) - Use PhotoItem type */}
                      {securityCheck.photos.map((photo: PhotoItem) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-colors group"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.filename}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Checker Data */}
          {checkerData && (
            <details className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <summary className="px-6 py-4 bg-blue-600 cursor-pointer hover:bg-blue-700 transition-colors flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <ClipboardCheck className="h-6 w-6" />
                  Data Checker oleh {checkerData.inspectorName}
                </h2>
                <div className="text-white text-sm">
                  Diperiksa pada{" "}
                  {new Date(checkerData.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </summary>

              <div className="p-6">
                {checkerData.remarks && (
                  <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Catatan Keseluruhan:
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      {checkerData.remarks}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium mb-4"
                >
                  Klik untuk buka
                </button>

                {checkerData.photos && checkerData.photos.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                      Foto Pemeriksaan Checker ({checkerData.photos.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {/* ✅ FIX: Remove (photo: any) - Use PhotoItem type */}
                      {checkerData.photos.map((photo: PhotoItem) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors group"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.filename}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
