import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  Eye,
  LucideIcon,
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
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconBg} rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl lg:text-3xl font-bold text-slate-900">
            {value}
          </p>
          <p className="text-sm text-slate-600">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface HistoryInspection {
  id: string;
  inspectionDate: Date;
  createdAt: Date;
  inspectorName: string;
  container: {
    id: string;
    containerNo: string;
    sealNo: string;
    companyName: string;
    plateNo: string;
    checkerData: {
      id: string;
      utcNo: string;
      createdAt: Date;
    } | null;
  };
}

function HistoryRow({ inspection }: { inspection: HistoryInspection }) {
  const hasChecker = !!inspection.container.checkerData;

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
      {/* Date & Time */}
      <td className="px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-900">
              {new Date(inspection.inspectionDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(inspection.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </td>

      {/* Container Info */}
      <td className="text-center px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono font-semibold text-slate-900 text-sm">
            {inspection.container.containerNo}
          </p>
          <p className="text-xs text-slate-600 font-mono">
            Segel: {inspection.container.sealNo}
          </p>
        </div>
      </td>

      {/* Company - Desktop only */}
      <td className="text-center px-6 py-4">
        <p className="text-sm text-slate-700">
          {inspection.container.companyName}
        </p>
      </td>

      {/* Plate Number - Desktop only */}
      <td className="text-center px-6 py-4">
        <p className="font-mono text-sm text-slate-700">
          {inspection.container.plateNo}
        </p>
      </td>

      {/* Inspector */}
      <td className="text-center px-4 lg:px-6 py-3 lg:py-4">
        <p className="text-sm text-slate-700">{inspection.inspectorName}</p>
      </td>

      {/* Status */}
      <td className="text-center px-4 lg:px-6 py-3 lg:py-4">
        {hasChecker ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        )}
      </td>

      {/* View Detail */}
      <td className="text-center px-4 lg:px-6 py-3 lg:py-4">
        <Link
          href={`/security/inspection/${inspection.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Detail</span>
        </Link>
      </td>
    </tr>
  );
}

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) return null;

  const inspections = await getInspections(session.userId);

  const totalInspections = inspections.length;
  const completedInspections = inspections.filter(
    (i) => i.container.checkerData
  ).length;
  const pendingInspections = totalInspections - completedInspections;

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/security/dashboard"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Kembali ke Dashboard</span>
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Riwayat Pemeriksaan
                </h1>
                <p className="text-slate-600 mt-1">
                  Semua riwayat pemeriksaan kontainer Anda
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
            <StatCard
              icon={FileText}
              label="Total Pemeriksaan"
              value={totalInspections}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />
            <StatCard
              icon={CheckCircle2}
              label="Selesai"
              value={completedInspections}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
            />
            <StatCard
              icon={Clock}
              label="Pending"
              value={pendingInspections}
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
            />
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Semua Pemeriksaan
                    </h2>
                    <p className="text-sm text-slate-600">
                      {totalInspections} pemeriksaan total
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {inspections.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-2">
                  Belum ada riwayat pemeriksaan
                </p>
                <p className="text-sm text-slate-500">
                  Pemeriksaan yang telah dilakukan akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {/* Tanggal - Compact di mobile */}
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Tanggal
                      </th>

                      {/* Kontainer - Compact di mobile */}
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Kontainer
                      </th>

                      {/* Perusahaan - Hidden di mobile, muncul di desktop */}
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Perusahaan
                      </th>

                      {/* No. Plat - Hidden di mobile, muncul di desktop */}
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        No. Plat
                      </th>

                      {/* Pemeriksa - Hidden di mobile, muncul di tablet+ */}
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Pemeriksa
                      </th>

                      {/* Status - Compact di mobile */}
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>

                      {/* Detail - Compact di mobile */}
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {inspections.map((inspection) => (
                      <HistoryRow key={inspection.id} inspection={inspection} />
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
