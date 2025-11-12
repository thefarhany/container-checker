import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import ReportsClient from "@/components/admin/ReportsClient";
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Filter,
  CalendarDays,
  Building2,
  LucideIcon,
} from "lucide-react";
import { Prisma } from "@prisma/client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Pengecekan | Container Checker",
  description: "Laporan Pengecekan",
};

interface PageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }>;
}

async function getReportData(filters: {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}) {
  const { dateFrom, dateTo, status } = filters;

  const whereClause: Prisma.ContainerWhereInput = {};

  if (dateFrom || dateTo) {
    whereClause.inspectionDate = {};
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      whereClause.inspectionDate.gte = fromDate;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      whereClause.inspectionDate.lte = toDate;
    }
  }

  const containers = await prisma.container.findMany({
    where: whereClause,
    include: {
      securityCheck: {
        include: {
          user: { select: { name: true } },
          photos: true,
          responses: {
            include: {
              checklistItem: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: [
              { checklistItem: { category: { order: "asc" } } },
              { checklistItem: { order: "asc" } },
            ],
          },
        },
      },
      checkerData: {
        include: {
          user: { select: { name: true } },
          photos: true,
        },
      },
    },
    orderBy: { inspectionDate: "desc" },
  });

  let filteredContainers = containers;

  if (status === "complete") {
    filteredContainers = containers.filter(
      (c) => c.securityCheck && c.checkerData
    );
  } else if (status === "pending-checker") {
    filteredContainers = containers.filter(
      (c) => c.securityCheck && !c.checkerData
    );
  } else if (status === "pending-security") {
    filteredContainers = containers.filter((c) => !c.securityCheck);
  }

  const totalContainers = filteredContainers.length;
  const completedContainers = filteredContainers.filter(
    (c) => c.securityCheck && c.checkerData
  ).length;
  const pendingChecker = filteredContainers.filter(
    (c) => c.securityCheck && !c.checkerData
  ).length;
  const pendingSecurity = filteredContainers.filter(
    (c) => !c.securityCheck
  ).length;

  return {
    containers: filteredContainers,
    stats: {
      totalContainers,
      completedContainers,
      pendingChecker,
      pendingSecurity,
    },
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
  bgGradient,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  iconColor: string;
  iconBg: string;
  bgGradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${bgGradient} p-6 shadow-lg`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          </div>
          <div className={`rounded-xl ${iconBg} p-3`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
        </div>
      </div>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10" />
    </div>
  );
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const { containers, stats } = await getReportData(resolvedParams);

  const hasActiveFilter =
    resolvedParams.dateFrom || resolvedParams.dateTo || resolvedParams.status;

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
        <div className="border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Laporan Kontainer
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Export data kontainer dalam format Excel atau CSV
                </p>
              </div>

              <ReportsClient containers={containers} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Package}
              label="Total Kontainer"
              value={stats.totalContainers}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={CheckCircle2}
              label="Selesai"
              value={stats.completedContainers}
              iconColor="text-green-600"
              iconBg="bg-green-100"
              bgGradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={Clock}
              label="Pending Checker"
              value={stats.pendingChecker}
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
              bgGradient="bg-gradient-to-br from-amber-500 to-amber-600"
            />
            <StatCard
              icon={Clock}
              label="Pending Security"
              value={stats.pendingSecurity}
              iconColor="text-gray-600"
              iconBg="bg-gray-100"
              bgGradient="bg-gradient-to-br from-gray-500 to-gray-600"
            />
          </div>

          <div className="mb-6 rounded-2xl bg-white p-4 sm:p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Filter Laporan
              </h2>
            </div>

            <form className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={resolvedParams.status || ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">Semua Status</option>
                    <option value="complete">Selesai</option>
                    <option value="pending-checker">Pending Checker</option>
                    <option value="pending-security">Pending Security</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Dari Tanggal
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="dateFrom"
                      defaultValue={resolvedParams.dateFrom}
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm sm:text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Sampai Tanggal
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="dateTo"
                      defaultValue={resolvedParams.dateTo}
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm sm:text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    Terapkan
                  </button>
                  <Link
                    href="/admin/reports"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Reset
                  </Link>
                </div>
              </div>
            </form>

            {hasActiveFilter && (
              <div className="mt-4 rounded-lg bg-purple-50 p-3">
                <p className="text-sm text-purple-800">
                  <span className="font-medium">Filter Aktif:</span> Menampilkan{" "}
                  <span className="font-bold">{containers.length}</span>{" "}
                  kontainer
                  {resolvedParams.dateFrom && resolvedParams.dateTo && (
                    <>
                      {" "}
                      dari{" "}
                      <span className="font-medium">
                        {new Date(resolvedParams.dateFrom).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>{" "}
                      sampai{" "}
                      <span className="font-medium">
                        {new Date(resolvedParams.dateTo).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Data Laporan
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                      No. Kontainer
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                      No. UTC
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                      Perusahaan
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                      Tanggal
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                      Security
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                      Checker
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {containers.length > 0 ? (
                    containers.map((container) => {
                      const hasSecurity = !!container.securityCheck;
                      const hasChecker = !!container.checkerData;

                      return (
                        <tr
                          key={container.id}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <td className="px-3 sm:px-6 py-4">
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-gray-900 break-all">
                                {container.containerNo}
                              </div>
                              <div className="text-xs text-gray-500">
                                Segel: {container.sealNo}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 sm:px-6 py-4">
                            {hasChecker ? (
                              <span className="text-xs sm:text-sm font-medium text-gray-900">
                                {container.checkerData?.utcNo}
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm text-gray-400">
                                -
                              </span>
                            )}
                          </td>

                          <td className="hidden sm:table-cell px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-900">
                                {container.companyName}
                              </span>
                            </div>
                          </td>

                          <td className="hidden md:table-cell px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(
                                container.inspectionDate
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </td>

                          <td className="hidden lg:table-cell px-6 py-4">
                            {hasSecurity ? (
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-900">
                                    Selesai
                                  </span>
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500">
                                  {container.securityCheck?.user?.name}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  Belum ada
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="hidden lg:table-cell px-6 py-4">
                            {hasChecker ? (
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-900">
                                    Selesai
                                  </span>
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500">
                                  {container.checkerData?.user?.name}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  Belum ada
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="px-3 sm:px-6 py-4">
                            {hasSecurity && hasChecker ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 sm:px-3 py-1 text-xs font-medium text-green-800 whitespace-nowrap">
                                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Selesai
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 sm:px-3 py-1 text-xs font-medium text-amber-800 whitespace-nowrap">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-12 w-12 text-gray-300" />
                          <p className="text-sm font-medium text-gray-900">
                            {hasActiveFilter
                              ? "Tidak ada kontainer yang sesuai dengan filter"
                              : "Belum ada data kontainer"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hasActiveFilter
                              ? "Ubah filter untuk melihat data lain"
                              : "Data kontainer akan muncul di sini setelah Security melakukan pemeriksaan"}
                          </p>
                          {hasActiveFilter && (
                            <Link
                              href="/admin/reports"
                              className="text-sm text-purple-600 hover:text-purple-700"
                            >
                              Reset Filter
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
