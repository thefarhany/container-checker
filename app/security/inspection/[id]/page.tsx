import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface CategoryGrouped {
  name: string;
  description: string | null;
  items: Array<{
    itemText: string;
    description: string | null;
    checked: boolean;
    notes: string | null;
  }>;
}

async function getInspectionDetail(id: string) {
  const inspection = await prisma.securityCheck.findUnique({
    where: { id },
    include: {
      container: true,
      user: {
        select: {
          name: true,
        },
      },
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
      photos: true,
    },
  });
  return inspection;
}

export default async function SecurityInspectionDetailPage({
  params,
}: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "SECURITY") {
    redirect("/");
  }

  const resolvedParams = await params;
  const inspection = await getInspectionDetail(resolvedParams.id);

  if (!inspection) {
    return (
      <DashboardLayout session={session}>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Data Tidak Ditemukan
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Pemeriksaan tidak ditemukan atau telah dihapus
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const categoriesMap = inspection.responses.reduce((acc, response) => {
    const category = response.checklistItem.category;
    if (!acc[category.id]) {
      acc[category.id] = {
        id: category.id,
        name: category.name,
        description: category.description,
        order: category.order,
        items: [],
      };
    }
    acc[category.id].items.push(response);
    return acc;
  }, {} as Record<string, CategoryGrouped>);

  const sortedCategories = Object.values(categoriesMap).sort(
    (a, b) => a.order - b.order
  );

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-slate-50 py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6">
            <Link
              href="/security/dashboard"
              className="inline-flex items-center gap-2 text-sm sm:text-base text-blue-600 hover:text-blue-800 mb-3 sm:mb-4"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              Kembali
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 break-words">
                  Detail Pemeriksaan Kontainer
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 break-all">
                  Kontainer: {inspection.container.containerNo}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 sm:px-4 sm:py-2.5 shrink-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
                <span className="text-xs sm:text-sm font-semibold text-green-700 whitespace-nowrap">
                  Selesai Diperiksa
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm sm:text-base font-bold text-blue-700">
                    1
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                    Informasi Kontainer
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    Nama Perusahaan
                  </label>
                  <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-slate-900">
                    {inspection.container.companyName}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    No. Kontainer
                  </label>
                  <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-slate-900 break-all">
                    {inspection.container.containerNo}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    No. Segel
                  </label>
                  <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-slate-900">
                    {inspection.container.sealNo}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    No. Plat Kendaraan
                  </label>
                  <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-slate-900">
                    {inspection.container.plateNo}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    Tanggal Pemeriksaan
                  </label>
                  <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-slate-900">
                    {new Date(inspection.inspectionDate).toLocaleDateString(
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
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    Nama Pemeriksa
                  </label>
                  <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-slate-900">
                    {inspection.inspectorName}
                  </div>
                </div>
              </div>
            </div>

            {sortedCategories.map(
              (category: CategoryGrouped, catIdx: number) => (
                <div
                  key={category.id}
                  className="overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm sm:text-base font-bold text-blue-700">
                        {catIdx + 2}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="mt-1 text-xs sm:text-sm text-slate-600">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {category.items.map(
                      (response: CategoryGrouped["items"][number]) => (
                        <div
                          key={response.id}
                          className="px-4 sm:px-6 py-3 sm:py-4"
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-green-600" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm sm:text-base font-medium text-slate-900">
                                {response.checklistItem.itemText}
                              </p>
                              {response.checklistItem.description && (
                                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                                  {response.checklistItem.description}
                                </p>
                              )}
                              {response.notes && (
                                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-700 italic">
                                  {response.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Foto Pemeriksaan ({inspection.photos.length})
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                {inspection.photos.length > 0 ? (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {inspection.photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                      >
                        <Image
                          src={photo.url}
                          alt={`Foto ${index + 1}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm sm:text-base text-slate-500 py-6 sm:py-8">
                    Tidak ada foto
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Catatan Tambahan
                </h2>
              </div>
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap break-words">
                  {inspection.remarks || "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-4 sm:pb-6">
              <Link
                href="/security/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
