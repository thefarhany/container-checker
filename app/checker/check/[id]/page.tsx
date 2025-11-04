import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Image from "next/image";
import CheckerForm from "@/components/checker/CheckerForm";
import {
  Package,
  ImageIcon,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  Shield,
  Building2,
  Truck,
  Calendar,
  Info,
  StickyNote,
} from "lucide-react";

interface PageProps {
  params: {
    id: string;
  };
}

async function getContainerData(id: string) {
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
    },
  });

  return container;
}

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
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
      <div className="flex-shrink-0">
        {checked ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <XCircle className="w-6 h-6 text-red-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-gray-900">
            {number}. {itemText}
          </h4>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              checked
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {checked ? "Diperiksa" : "Tidak"}
          </span>
        </div>
        {notes && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <StickyNote className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Catatan Security:
                </p>
                <p className="text-sm text-blue-800">{notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function CheckerInspectionPage({ params }: PageProps) {
  const session = await getSession();

  if (!session || session.role !== "CHECKER") {
    redirect("/");
  }

  const container = await getContainerData(params.id);

  if (!container) {
    return (
      <DashboardLayout session={session}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Kontainer Tidak Ditemukan
            </h2>
            <p className="text-red-700">Data kontainer tidak tersedia</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const securityCheck = container.securityCheck;

  if (!securityCheck) {
    return (
      <DashboardLayout session={session}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Info className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-yellow-900 mb-2">
              Pemeriksaan Security Belum Ada
            </h2>
            <p className="text-yellow-700">
              Kontainer ini belum diperiksa oleh Security
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const responsesByCategory = securityCheck.responses.reduce(
    (acc, response) => {
      const categoryName = response.checklistItem.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(response);
      return acc;
    },
    {} as Record<string, typeof securityCheck.responses>
  );

  return (
    <DashboardLayout session={session}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">
                Verifikasi hasil pemeriksaan Security dan tambahkan data Checker
              </h1>
              <p className="text-blue-100 mt-1">
                Tinjau hasil pemeriksaan Security terlebih dahulu
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">
                Perhatian untuk Checker
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Periksa checklist dan foto dari Security sebelum mengisi form
                Checker
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informasi Kontainer
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Package className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">No. Kontainer</p>
                <p className="font-semibold text-gray-900">
                  {container.containerNo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building2 className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Perusahaan</p>
                <p className="font-semibold text-gray-900">
                  {container.companyName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">No. Segel</p>
                <p className="font-semibold text-gray-900">
                  {container.sealNo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Truck className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">No. Plat</p>
                <p className="font-semibold text-gray-900">
                  {container.plateNo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Tanggal Pemeriksaan</p>
                <p className="font-semibold text-gray-900">
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Informasi Pemeriksaan Security
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Diperiksa oleh:</p>
                <p className="font-semibold text-green-900">
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
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">Total Pemeriksaan:</p>
                <p className="font-semibold text-blue-900">
                  {securityCheck.responses.length} item pemeriksaan
                </p>
              </div>
            </div>

            {securityCheck.remarks && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 mb-1">
                      Catatan Umum Security:
                    </p>
                    <p className="text-yellow-800">{securityCheck.remarks}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {Object.entries(responsesByCategory).map(
          ([categoryName, responses]) => (
            <div
              key={categoryName}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  {categoryName}
                </h2>
              </div>

              <div className="p-6 space-y-3">
                {responses.map((response, idx) => (
                  <ChecklistItemDisplay
                    key={response.id}
                    number={idx + 1}
                    itemText={response.checklistItem.itemText}
                    notes={response.notes}
                    checked={response.checked}
                  />
                ))}
              </div>
            </div>
          )
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Foto Hasil Pemeriksaan Security ({securityCheck.photos.length})
            </h2>
          </div>

          <div className="p-6">
            {securityCheck.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {securityCheck.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all group"
                  >
                    <Image
                      src={photo.url}
                      alt={`Foto ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium">
                        Foto {index + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Tidak ada foto dari Security</p>
              </div>
            )}
          </div>
        </div>

        <CheckerForm
          containerId={container.id}
          containerNo={container.containerNo}
        />
      </div>
    </DashboardLayout>
  );
}
