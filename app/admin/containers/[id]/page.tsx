import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Calendar,
  User,
  FileText,
  ImageIcon,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Shield,
  ClipboardCheck,
  Building2,
  Truck,
  StickyNote,
} from "lucide-react";

interface PageProps {
  params: {
    id: string;
  };
}

async function getContainerDetail(id: string) {
  const container = await prisma.container.findUnique({
    where: { id },
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
  return container;
}

// Component untuk menampilkan checklist item dengan catatan Security
function ChecklistItemDisplay({
  itemText,
  notes,
  checked,
  number,
}: {
  itemText: string;
  notes: string | null;
  checked: boolean;
  number: number;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-gray-900 flex-1">{itemText}</p>
            {checked ? (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3" />
                Diperiksa
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full whitespace-nowrap">
                <XCircle className="w-3 h-3" />
                Belum
              </span>
            )}
          </div>
          {notes && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-gray-700">
              <span className="font-medium text-blue-900">
                Catatan Security:
              </span>
              <p className="mt-1">{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AdminContainerDetailPage({ params }: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const container = await getContainerDetail(params.id);

  if (!container) {
    return (
      <DashboardLayout session={session}>
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Data kontainer tidak tersedia
          </h2>
          <Link
            href="/admin/containers"
            className="text-blue-600 hover:text-blue-700"
          >
            Kembali ke daftar kontainer
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const securityCheck = container.securityCheck;
  const checkerData = container.checkerData;

  // Group responses by category
  const responsesByCategory = securityCheck?.responses.reduce(
    (acc: any, response) => {
      const categoryName = response.checklistItem.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push({
        itemText: response.checklistItem.itemText,
        notes: response.notes,
        checked: response.checked === true,
      });
      return acc;
    },
    {}
  );

  return (
    <DashboardLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/containers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detail Kontainer
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {checkerData && securityCheck
                ? "Pemeriksaan Selesai"
                : "Pemeriksaan Belum Lengkap"}
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {checkerData && securityCheck ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">
                  Pemeriksaan Selesai
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Kontainer ini telah diperiksa oleh Security dan Checker
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Perhatian untuk Admin
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Pemeriksaan belum lengkap. Pastikan Security dan Checker sudah
                  menyelesaikan tugasnya.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informasi Kontainer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informasi Kontainer
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  No. Kontainer
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {container.containerNo}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Perusahaan
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {container.companyName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  No. Segel
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {container.sealNo}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  No. Plat
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {container.plateNo}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tanggal Pemeriksaan
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(container.inspectionDate).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
              {checkerData && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    Nomor UTC
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {checkerData.utcNo}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Checker */}
        {checkerData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-purple-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Data Checker
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Checker Info */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-purple-900 font-medium">
                      Diperiksa oleh
                    </p>
                    <p className="text-lg font-semibold text-purple-900 mt-1">
                      {checkerData.user?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-purple-700 mt-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Waktu
                    </p>
                    <p className="text-sm text-purple-800 mt-1">
                      Diperiksa pada{" "}
                      {new Date(checkerData.createdAt).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {checkerData.remarks && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <StickyNote className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        Catatan Checker:
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {checkerData.remarks}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Photos */}
              {checkerData.photos && checkerData.photos.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Foto dari Checker ({checkerData.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {checkerData.photos.map((photo, index) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all cursor-pointer"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.filename || `Photo ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs truncate">
                            {photo.filename}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Security */}
        {securityCheck ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Data Security
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Security Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-900 font-medium">
                      Diperiksa oleh:
                    </p>
                    <p className="text-base font-semibold text-green-900 mt-1">
                      {securityCheck.user?.name || "Unknown"} pada{" "}
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
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                      Total Pemeriksaan:{" "}
                      <span className="font-semibold">
                        {securityCheck.responses.length} item pemeriksaan
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {securityCheck.remarks && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <StickyNote className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        Catatan Security:
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {securityCheck.remarks}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist by Category */}
              {responsesByCategory &&
                Object.keys(responsesByCategory).length > 0 && (
                  <div className="space-y-6">
                    {Object.entries(responsesByCategory).map(
                      ([categoryName, items]: [string, any]) => (
                        <div key={categoryName} className="space-y-3">
                          <h3 className="text-base font-bold text-gray-900 bg-blue-600 text-white px-4 py-2 rounded-lg">
                            {categoryName}
                          </h3>
                          <div className="space-y-2">
                            {items.map((item: any, index: number) => (
                              <ChecklistItemDisplay
                                key={index}
                                number={index + 1}
                                itemText={item.itemText}
                                notes={item.notes}
                                checked={item.checked}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* Photos */}
              {securityCheck.photos && securityCheck.photos.length > 0 ? (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Foto dari Security ({securityCheck.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {securityCheck.photos.map((photo, index) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-500 transition-all cursor-pointer"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.filename || `Photo ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs truncate">
                            {photo.filename}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Tidak ada foto dari Security
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Kontainer ini belum diperiksa oleh Security
            </h3>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
