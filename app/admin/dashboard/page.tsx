import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
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

async function getStatistics() {
  const allContainers = await prisma.container.findMany({
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

  const recentContainers = allContainers.slice(0, 5);

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
  icon: any;
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
      className={`${bgGradient} rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${iconBg} rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {linkText} →
          </Link>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
        <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  iconColor,
  iconBg,
}: {
  icon: any;
  title: string;
  description: string;
  href: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 ${iconBg} rounded-xl group-hover:scale-110 transition-transform`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const stats = await getStatistics();

  return (
    <DashboardLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard Admin
              </h1>
              <p className="text-gray-600">
                Selamat datang kembali,{" "}
                <span className="font-semibold">{session.name}</span>
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-purple-200">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            label="Total Kontainer"
            value={stats.totalContainers}
            subtitle="Semua data kontainer"
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
            bgGradient="bg-gradient-to-br from-white to-blue-50"
            linkText="Lihat semua"
            linkHref="/admin/containers"
          />
          <StatCard
            icon={Users}
            label="Total Pengguna"
            value={stats.totalUsers}
            subtitle="User aktif sistem"
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
            bgGradient="bg-gradient-to-br from-white to-purple-50"
            linkText="Kelola"
            linkHref="/admin/users"
          />
          <StatCard
            icon={CheckCircle2}
            label="Selesai"
            value={stats.completedChecks}
            subtitle="Pemeriksaan lengkap"
            iconColor="text-green-600"
            iconBg="bg-green-100"
            bgGradient="bg-gradient-to-br from-white to-green-50"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pendingChecks}
            subtitle="Menunggu pemeriksaan"
            iconColor="text-orange-600"
            iconBg="bg-orange-100"
            bgGradient="bg-gradient-to-br from-white to-orange-50"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Aksi Cepat</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionCard
                icon={Package}
                title="Data Kontainer"
                description="Lihat & kelola semua data kontainer"
                href="/admin/containers"
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
              />
              <QuickActionCard
                icon={Users}
                title="Manajemen User"
                description="Kelola pengguna sistem"
                href="/admin/users"
                iconColor="text-purple-600"
                iconBg="bg-purple-100"
              />
              <QuickActionCard
                icon={BarChart3}
                title="Laporan"
                description="Export & analisis data"
                href="/admin/reports"
                iconColor="text-green-600"
                iconBg="bg-green-100"
              />
            </div>
          </div>
        </div>

        {/* Recent Containers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Kontainer Terbaru
            </h2>
            <Link
              href="/admin/containers"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            {stats.recentContainers.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      No. Kontainer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Perusahaan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Security
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Checker
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentContainers.map((container) => {
                    const hasSecurity = !!container.securityCheck;
                    const hasChecker = !!container.checkerData;

                    return (
                      <tr
                        key={container.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">
                              {container.containerNo}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {container.companyName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {hasSecurity ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-700">
                                {container.securityCheck?.user?.name ||
                                  "Security User"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {hasChecker ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-purple-600" />
                              <span className="text-sm text-gray-700">
                                {container.checkerData?.user?.name ||
                                  "Checker User"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {hasSecurity && hasChecker ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai
                            </span>
                          ) : hasSecurity ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Checker
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Security
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {new Date(container.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/containers/${container.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  Belum ada data kontainer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
