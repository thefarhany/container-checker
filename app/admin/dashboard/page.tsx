import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import DateFilterButton from "@/components/DateFilterButton";
import {
  Package,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Eye,
  BarChart3,
} from "lucide-react";
import { ElementType } from "react";

interface PageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

async function getStatistics(selectedDate?: string) {
  const whereClause: {
    inspectionDate?: {
      gte: Date;
      lte: Date;
    };
  } = {};

  if (selectedDate) {
    const filterDate = new Date(selectedDate);
    const startOfDay = new Date(filterDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(filterDate);
    endOfDay.setHours(23, 59, 59, 999);

    whereClause.inspectionDate = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  const allContainers = await prisma.container.findMany({
    where: whereClause,
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

  const totalContainers = allContainers.length;
  const totalUsers = await prisma.user.count();

  const completedContainers = allContainers.filter(
    (c) => c.securityCheck !== null && c.checkerData !== null
  ).length;

  const pendingContainers = totalContainers - completedContainers;
  const recentContainers = allContainers.slice(0, 10);

  return {
    totalContainers,
    totalUsers,
    completedChecks: completedContainers,
    pendingChecks: pendingContainers,
    recentContainers,
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor,
  iconBg,
  bgGradient,
  linkText,
  linkHref,
}: {
  icon: ElementType;
  label: string;
  value: number;
  subtitle: string;
  iconColor: string;
  iconBg: string;
  bgGradient: string;
  linkText?: string;
  linkHref?: string;
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
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className="mt-4 inline-flex items-center text-sm font-medium text-white hover:text-white/80"
          >
            {linkText}
            <BarChart3 className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10" />
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const selectedDate = resolvedParams.date;

  const stats = await getStatistics(selectedDate);

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Dashboard Admin
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Selamat datang kembali,{" "}
                  <span className="font-medium">{session.name}</span>
                </p>
              </div>

              {/* Date Filter Button */}
              <DateFilterButton />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Statistics Cards */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 -z-20">
            <StatCard
              icon={Package}
              label="Total Kontainer"
              value={stats.totalContainers}
              subtitle={
                selectedDate ? "Pada tanggal ini" : "Semua data kontainer"
              }
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={Users}
              label="Total Pengguna"
              value={stats.totalUsers}
              subtitle="User aktif sistem"
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              bgGradient="bg-gradient-to-br from-purple-500 to-purple-600"
              linkText="Kelola Pengguna"
              linkHref="/admin/users"
            />
            <StatCard
              icon={CheckCircle2}
              label="Selesai"
              value={stats.completedChecks}
              subtitle="Pemeriksaan lengkap"
              iconColor="text-green-600"
              iconBg="bg-green-100"
              bgGradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={Clock}
              label="Pending"
              value={stats.pendingChecks}
              subtitle="Menunggu pemeriksaan"
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
              bgGradient="bg-gradient-to-br from-amber-500 to-amber-600"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8 grid gap-6 sm:grid-cols-3">
            <Link
              href="/admin/containers"
              className="group rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-400 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Data Kontainer
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Lihat & kelola semua data kontainer
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="group rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-400 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Manajemen User
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Kelola pengguna sistem
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/reports"
              className="group rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-400 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-100 p-3 group-hover:bg-green-200 transition-colors">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Laporan</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Export & analisis data
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Containers Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Kontainer {selectedDate ? "Terfilter" : "Terbaru"}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">
                    {stats.recentContainers.length} kontainer ditampilkan
                  </p>
                </div>
                <Link
                  href="/admin/containers"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Lihat Semua →
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      No. Kontainer
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Perusahaan
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Security
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Checker
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {stats.recentContainers.length > 0 ? (
                    stats.recentContainers.map((container) => {
                      const hasSecurity = !!container.securityCheck;
                      const hasChecker = !!container.checkerData;
                      const isComplete = hasSecurity && hasChecker;

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

                          <td className="hidden sm:table-cell px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-900 truncate">
                                {container.companyName}
                              </span>
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
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 sm:px-3 py-1 text-xs font-medium text-green-800">
                                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Lengkap
                              </span>
                            ) : hasSecurity || hasChecker ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 sm:px-3 py-1 text-xs font-medium text-amber-800">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Proses
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 sm:px-3 py-1 text-xs font-medium text-gray-800">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Menunggu
                              </span>
                            )}
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

                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex items-center justify-center">
                              <Link
                                href={`/admin/containers/${container.id}`}
                                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg bg-purple-600 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-purple-700 shadow-sm hover:shadow-md"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Detail</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Package className="h-12 w-12 text-gray-300" />
                          <p className="text-sm font-medium text-gray-900">
                            {selectedDate
                              ? "Tidak ada kontainer pada tanggal ini"
                              : "Belum ada data kontainer"}
                          </p>
                          {selectedDate && (
                            <Link
                              href="/admin/dashboard"
                              className="text-sm text-purple-600 hover:text-purple-700"
                            >
                              Lihat Semua Data
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
