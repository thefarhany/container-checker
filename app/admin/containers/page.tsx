import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Eye,
  Search,
  Filter,
  CalendarDays,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
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
      securityCheck: {
        include: {
          user: {
            select: {
              name: true,
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
        c.sealNo.toLowerCase().includes(searchLower) ||
        (c.checkerData?.utcNo || "").toLowerCase().includes(searchLower)
    );
  }

  if (status === "complete") {
    filtered = filtered.filter((c) => c.securityCheck && c.checkerData);
  } else if (status === "pending-checker") {
    filtered = filtered.filter((c) => c.securityCheck && !c.checkerData);
  } else if (status === "pending-security") {
    filtered = filtered.filter((c) => !c.securityCheck);
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

export default async function AdminContainersPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const containers = await getAllContainers(resolvedParams);

  const hasActiveFilter =
    resolvedParams.search ||
    resolvedParams.status ||
    resolvedParams.dateFrom ||
    resolvedParams.dateTo;

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl py-6 sm:px-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Semua Kontainer
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Kelola dan pantau semua kontainer dalam sistem
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl py-8 sm:px-6">
          {/* Filter Section */}
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
                  placeholder="Cari no. kontainer, perusahaan, plat, segel, atau UTC..."
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
                    <option value="complete">Selesai</option>
                    <option value="pending-checker">Pending Checker</option>
                    <option value="pending-security">Pending Security</option>
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
                    className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    Terapkan
                  </button>
                  <Link
                    href="/admin/containers"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Reset
                  </Link>
                </div>
              </div>
            </form>

            {/* Filter Info */}
            {hasActiveFilter && (
              <div className="mt-4 rounded-lg bg-purple-50 p-3">
                <p className="text-sm text-purple-800">
                  <span className="font-medium">Filter Aktif:</span> Menampilkan{" "}
                  <span className="font-bold">{containers.length}</span>{" "}
                  kontainer
                </p>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Daftar Kontainer
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Total {containers.length} kontainer
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      No. Kontainer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      No. UTC
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Perusahaan
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Security
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Checker
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {containers.length > 0 ? (
                    containers.map((container) => {
                      const hasSecurity = !!container.securityCheck;
                      const hasChecker = !!container.checkerData;

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
                            {hasChecker ? (
                              <span className="font-medium text-gray-900">
                                {container.checkerData?.utcNo}
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

                          {/* Security Status */}
                          <td className="px-6 py-4">
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

                          {/* Checker Status */}
                          <td className="px-6 py-4">
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

                          {/* Overall Status */}
                          <td className="px-6 py-4">
                            {hasSecurity && hasChecker ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Selesai
                              </span>
                            ) : hasSecurity ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                                <Clock className="h-3.5 w-3.5" />
                                Pending Checker
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                                <Clock className="h-3.5 w-3.5" />
                                Pending Security
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
                            <div className="flex items-center justify-center">
                              <Link
                                href={`/admin/containers/${container.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                              >
                                <Eye className="h-4 w-4" />
                                Detail
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Package className="h-12 w-12 text-gray-300" />
                          <p className="text-sm font-medium text-gray-900">
                            {hasActiveFilter
                              ? "Tidak ada kontainer yang sesuai dengan filter"
                              : "Belum ada data kontainer"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hasActiveFilter
                              ? "Coba ubah filter pencarian"
                              : "Data kontainer akan muncul di sini setelah Security melakukan pemeriksaan"}
                          </p>
                          {hasActiveFilter && (
                            <Link
                              href="/admin/containers"
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
