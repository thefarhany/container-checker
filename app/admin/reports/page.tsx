import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardLayout from "@/components/Dashboard";
import ReportsClient from "@/components/admin/ReportsClient";
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Filter,
  Search,
  XCircle,
} from "lucide-react";
import { Metadata } from "next";
import { getReportData } from "@/app/actions/reports";

export const metadata: Metadata = {
  title: "Laporan Pengecekan | Container Checker",
  description: "Laporan dan Export Data Pemeriksaan Kontainer",
};

interface PageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const { dateFrom, dateTo, status, search } = params;

  // Get data with filters
  const result = await getReportData({
    dateFrom,
    dateTo,
    status,
    search,
  });

  if ("error" in result) {
    redirect("/login");
  }

  const containers = result.data || [];

  // Calculate stats
  const totalContainers = containers.length;
  const completed = containers.filter(
    (c) => c.securityCheck && c.checkerData
  ).length;
  const pendingChecker = containers.filter(
    (c) => c.securityCheck && !c.checkerData
  ).length;
  const pendingSecurity = containers.filter((c) => !c.securityCheck).length;

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Laporan Pemeriksaan
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Export dan analisis data pemeriksaan kontainer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Data
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {totalContainers}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Selesai</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {completed}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Pending Checker
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {pendingChecker}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Pending Security
                  </p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {pendingSecurity}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Filter Data
              </h3>
            </div>

            <form method="GET" className="space-y-4">
              {/* Search */}
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pencarian
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="search"
                    name="search"
                    defaultValue={search || ""}
                    placeholder="Cari no. kontainer, perusahaan, UTC, segel, plat..."
                    className="w-full pl-10 pr-4 py-2.5 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Date Range & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="dateFrom"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Dari Tanggal
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      id="dateFrom"
                      name="dateFrom"
                      defaultValue={dateFrom || ""}
                      className="w-full pl-10 pr-4 py-2.5 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="dateTo"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Sampai Tanggal
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      id="dateTo"
                      name="dateTo"
                      defaultValue={dateTo || ""}
                      className="w-full pl-10 pr-4 py-2.5 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={status || ""}
                    className="w-full px-4 py-2.5 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Semua Status</option>
                    <option value="completed">Selesai</option>
                    <option value="pending-checker">Pending Checker</option>
                    <option value="pending-security">Pending Security</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  Terapkan Filter
                </button>
                <a
                  href="/admin/reports"
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Reset
                </a>
              </div>
            </form>
          </div>

          {/* Export Section */}
          <ReportsClient containers={containers} />

          {/* Data Table Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview Data ({containers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. Kontainer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perusahaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inspector
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {containers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Tidak ada data. Ubah filter untuk melihat data.
                      </td>
                    </tr>
                  ) : (
                    containers.slice(0, 10).map((container) => {
                      const hasSecurity = !!container.securityCheck;
                      const hasChecker = !!container.checkerData;
                      const status =
                        hasSecurity && hasChecker
                          ? "Selesai"
                          : hasSecurity
                          ? "Pending Checker"
                          : "Pending Security";

                      return (
                        <tr key={container.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {container.containerNo}
                            </div>
                            <div className="text-xs text-gray-500">
                              {container.checkerData?.utcNo || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {container.companyName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {container.sealNo} • {container.plateNo}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              container.inspectionDate
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                status === "Selesai"
                                  ? "bg-green-100 text-green-800"
                                  : status === "Pending Checker"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-900">
                              Sec:{" "}
                              {container.securityCheck?.inspectorName || "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Chk: {container.checkerData?.inspectorName || "-"}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {containers.length > 10 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
                Menampilkan 10 dari {containers.length} data. Export untuk
                melihat semua data.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
