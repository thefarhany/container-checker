import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import DeleteIconButton from "@/components/security/dashboard/DeleteIconButton";
import Link from "next/link";
import {
  Package,
  Calendar,
  TrendingUp,
  Clock,
  Eye,
  Edit,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
} from "lucide-react";

async function getInspections(userId: string) {
  return await prisma.securityCheck.findMany({
    where: { userId },
    include: {
      container: {
        include: {
          checkerData: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

async function getStatistics(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);

  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - 14);

  const lastWeekEnd = new Date();
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  const [
    totalInspections,
    todayInspections,
    weekInspections,
    lastWeekInspections,
    pendingChecker,
  ] = await Promise.all([
    prisma.securityCheck.count({ where: { userId } }),
    prisma.securityCheck.count({
      where: { userId, inspectionDate: { gte: today } },
    }),
    prisma.securityCheck.count({
      where: { userId, createdAt: { gte: thisWeekStart } },
    }),
    prisma.securityCheck.count({
      where: { userId, createdAt: { gte: lastWeekStart, lt: lastWeekEnd } },
    }),
    prisma.securityCheck.count({
      where: { userId, container: { checkerData: null } },
    }),
  ]);

  const weeklyChange =
    lastWeekInspections > 0
      ? ((weekInspections - lastWeekInspections) / lastWeekInspections) * 100
      : weekInspections > 0
      ? 100
      : 0;

  return {
    totalInspections,
    todayInspections,
    weekInspections,
    weeklyChange,
    pendingChecker,
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  iconColor,
  iconBg,
}: {
  icon: any;
  label: string;
  value: number;
  subtitle: string;
  trend?: { value: number; isPositive: boolean };
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="group bg-white rounded-xl lg:rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 p-5 lg:p-6 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <div
          className={`p-2.5 lg:p-3 ${iconBg} rounded-lg lg:rounded-xl group-hover:scale-110 transition-all duration-300`}
        >
          <Icon
            className={`w-5 h-5 lg:w-6 lg:h-6 ${iconColor} transition-colors`}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {subtitle}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-2xl lg:text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            <TrendingUp
              className={`w-3.5 h-3.5 ${!trend.isPositive && "rotate-180"}`}
            />
            <span>{Math.abs(trend.value).toFixed(1)}% vs minggu lalu</span>
          </div>
        )}
      </div>
    </div>
  );
}

function InspectionRow({ inspection }: { inspection: any }) {
  const hasChecker = !!inspection.container.checkerData;

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 text-center lg:px-6 py-3 lg:py-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono font-semibold text-slate-900 text-sm lg:text-base">
            {inspection.container.containerNo}
          </p>
          <p className="text-xs lg:text-sm text-slate-600 font-mono">
            {inspection.container.sealNo}
          </p>
          <p className="text-xs text-slate-500 lg:hidden">
            {inspection.container.companyName}
          </p>
        </div>
      </td>

      <td className="text-center px-6 py-4">
        <p className="text-sm text-slate-700">
          {inspection.container.companyName}
        </p>
      </td>

      <td className="text-center px-6 py-4">
        <p className="font-mono text-sm text-slate-700">
          {inspection.container.plateNo}
        </p>
      </td>

      <td className="text-center px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>
            {new Date(inspection.inspectionDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="text-center px-4 lg:px-6 py-3 lg:py-4">
        {hasChecker ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1 lg:py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs lg:text-sm font-medium">
            <CheckCircle2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
            <span className="hidden sm:inline">Selesai</span>
            <span className="sm:hidden">✓</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1 lg:py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs lg:text-sm font-medium">
            <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">⏳</span>
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="mx-auto px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center justify-center gap-1 lg:gap-2">
          <Link
            href={`/security/inspection/${inspection.id}`}
            className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/security/inspection/${inspection.id}/edit`}
            className="p-1.5 lg:p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <DeleteIconButton inspectionId={inspection.id} />
        </div>
      </td>
    </tr>
  );
}

export default async function SecurityDashboard() {
  const session = await getSession();
  if (!session) return null;

  const [inspections, stats] = await Promise.all([
    getInspections(session.userId),
    getStatistics(session.userId),
  ]);

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
        {/* Header */}
        <div className="border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm bg-white/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Dashboard Security
                </h1>
                <p className="text-slate-600 mt-1">
                  Selamat datang kembali,{" "}
                  <span className="font-semibold text-slate-900">
                    {session.name}
                  </span>
                </p>
              </div>
              <Link
                href="/security/inspection/new"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Pemeriksaan Baru</span>
                <span className="sm:hidden">Baru</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <StatCard
              icon={Package}
              label="Total Pemeriksaan"
              value={stats.totalInspections}
              subtitle="Total"
              iconColor="text-blue-600 group-hover:text-white"
              iconBg="bg-blue-100 group-hover:bg-blue-500"
            />
            <StatCard
              icon={Calendar}
              label="Pemeriksaan Hari Ini"
              value={stats.todayInspections}
              subtitle="Hari Ini"
              iconColor="text-emerald-600 group-hover:text-white"
              iconBg="bg-emerald-100 group-hover:bg-emerald-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Minggu Ini"
              value={stats.weekInspections}
              subtitle="7 Hari"
              trend={{
                value: stats.weeklyChange,
                isPositive: stats.weeklyChange >= 0,
              }}
              iconColor="text-purple-600 group-hover:text-white"
              iconBg="bg-purple-100 group-hover:bg-purple-500"
            />
            <StatCard
              icon={Clock}
              label="Menunggu Checker"
              value={stats.pendingChecker}
              subtitle="Pending"
              iconColor="text-amber-600 group-hover:text-white"
              iconBg="bg-amber-100 group-hover:bg-amber-500"
            />
          </div>

          {/* Inspections Table */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Pemeriksaan Terakhir Anda
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Data pemeriksaan terbaru
                  </p>
                </div>
                <Link
                  href="/security/history"
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Lihat Semua</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {inspections.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-4">
                  Belum ada data pemeriksaan
                </p>
                <Link
                  href="/security/inspection/new"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Mulai Pemeriksaan Pertama</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Kontainer
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Perusahaan
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        No. Plat
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.map((inspection) => (
                      <InspectionRow
                        key={inspection.id}
                        inspection={inspection}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
