import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Package,
  Calendar,
  Eye,
  Building2,
  ClipboardCheck,
  Search,
  Filter,
  CalendarDays,
  Edit,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

async function getStatistics(userId: string) {
  const allContainers = await prisma.container.findMany({
    include: {
      checkerData: true,
    },
  });

  const totalContainers = allContainers.length;

  const checkedCount = allContainers.filter(
    (c) => c.checkerData !== null && c.checkerData.userId === userId
  ).length;

  const pendingCount = totalContainers - checkedCount;

  return {
    totalContainers,
    checkedCount,
    pendingCount,
  };
}

async function getAllContainers(filters: {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { search, status, dateFrom, dateTo } = filters;

  const containers = await prisma.container.findMany({
    include: {
      checkerData: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      securityCheck: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let filtered = containers;

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.containerNo.toLowerCase().includes(searchLower) ||
        c.companyName.toLowerCase().includes(searchLower) ||
        c.plateNo.toLowerCase().includes(searchLower) ||
        (c.checkerData?.utcNo || "").toLowerCase().includes(searchLower)
    );
  }

  if (status === "pending") {
    filtered = filtered.filter((c) => !c.checkerData);
  } else if (status === "checked") {
    filtered = filtered.filter((c) => !!c.checkerData);
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter((c) => new Date(c.inspectionDate) >= fromDate);
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((c) => new Date(c.inspectionDate) <= toDate);
  }

  return filtered;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor,
  iconBg,
  bgGradient,
}: {
  icon: any;
  label: string;
  value: number;
  subtitle: string;
  iconColor: string;
  iconBg: string;
  bgGradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${bgGradient} p-6 shadow-lg transition-all hover:shadow-xl`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-white/70">{subtitle}</p>
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

export default async function CheckerDashboardPage({
  searchParams,
}: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "CHECKER") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const stats = await getStatistics(session.userId);
  const filteredContainers = await getAllContainers(resolvedParams);

  const allContainersCount = stats.totalContainers;

  const hasActiveFilter =
    resolvedParams.search ||
    resolvedParams.status ||
    resolvedParams.dateFrom ||
    resolvedParams.dateTo;

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Checker
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Selamat datang kembali, {session.name}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-0 py-8 sm:px-6">
          {/* Statistics Cards */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Package}
              label="Total Kontainer"
              value={stats.totalContainers}
              subtitle="Semua kontainer"
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={CheckCircle2}
              label="Sudah Diperiksa"
              value={stats.checkedCount}
              subtitle="Kontainer terverifikasi"
              iconColor="text-green-600"
              iconBg="bg-green-100"
              bgGradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={Clock}
              label="Menunggu"
              value={stats.pendingCount}
              subtitle="Perlu pemeriksaan"
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
              bgGradient="bg-gradient-to-br from-amber-500 to-amber-600"
            />
          </div>

          {/* Filter and Search Section */}
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Filter & Pencarian
              </h2>
            </div>

            <form className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Cari no. kontainer, perusahaan, plat, atau UTC..."
                  defaultValue={resolvedParams.search}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-black"
                />
              </div>

              {/* Filters Row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Status Filter */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={resolvedParams.status || ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-black"
                  >
                    <option value="">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="checked">Sudah Diperiksa</option>
                  </select>
                </div>

                {/* Date From */}
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
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-black"
                    />
                  </div>
                </div>

                {/* Date To */}
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
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-black"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Terapkan
                  </button>
                  <Link
                    href="/checker/dashboard"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Reset
                  </Link>
                </div>
              </div>
            </form>

            {/* Filter Info */}
            {hasActiveFilter && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Filter Aktif:</span> Menampilkan{" "}
                  <span className="font-bold">{filteredContainers.length}</span>{" "}
                  dari <span className="font-bold">{allContainersCount}</span>{" "}
                  kontainer
                </p>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Kontainer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      No. UTC
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Perusahaan
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredContainers.length > 0 ? (
                    filteredContainers.map((container) => {
                      const checkerData = container.checkerData;
                      const isChecked = !!checkerData;
                      const isMyCheck = checkerData?.userId === session.userId;

                      return (
                        <tr
                          key={container.id}
                          className="transition-colors hover:bg-gray-50"
                        >
                          {/* Container Info */}
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {container.containerNo}
                              </div>
                              <div className="text-sm text-gray-500">
                                Segel: {container.sealNo}
                              </div>
                            </div>
                          </td>

                          {/* UTC Number */}
                          <td className="px-6 py-4">
                            {checkerData ? (
                              <span className="font-medium text-gray-900">
                                {checkerData.utcNo}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>

                          {/* Company */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {container.companyName}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {isChecked ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Sudah Diperiksa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                                <Clock className="h-3.5 w-3.5" />
                                Menunggu
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4">
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

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {isChecked ? (
                                <>
                                  <Link
                                    href={`/checker/detail/${container.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Lihat
                                  </Link>
                                </>
                              ) : (
                                <Link
                                  href={`/checker/check/${container.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                                >
                                  <ClipboardCheck className="h-4 w-4" />
                                  Periksa
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Package className="h-12 w-12 text-gray-300" />
                          <p className="text-sm font-medium text-gray-900">
                            {hasActiveFilter
                              ? "Tidak ada kontainer yang sesuai dengan filter"
                              : "Belum ada data kontainer"}
                          </p>
                          {hasActiveFilter && (
                            <Link
                              href="/checker/dashboard"
                              className="text-sm text-blue-600 hover:text-blue-700"
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
