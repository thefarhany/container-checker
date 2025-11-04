"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Calendar,
  Filter,
  X,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  AlertCircle,
} from "lucide-react";

interface Inspection {
  id: string;
  inspectionDate: Date;
  inspectorName: string;
  remarks: string | null;
  createdAt: Date;
  container: {
    containerNo: string;
    companyName: string;
    sealNo: string;
    plateNo: string;
    checkerData: string | null;
  };
}

interface HistoryClientProps {
  inspections: Inspection[];
  totalInspections: number;
  searchParams: {
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

export default function HistoryClient({
  inspections,
  totalInspections,
  searchParams,
}: HistoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [localSearch, setLocalSearch] = useState(searchParams.search || "");
  const [localStartDate, setLocalStartDate] = useState(
    searchParams.startDate || ""
  );
  const [localEndDate, setLocalEndDate] = useState(searchParams.endDate || "");
  const [localStatus, setLocalStatus] = useState(searchParams.status || "all");

  const updateURL = (params: Record<string, string>) => {
    const url = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "all") {
        url.set(key, value);
      }
    });
    const queryString = url.toString();
    startTransition(() => {
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({
      search: localSearch,
      startDate: localStartDate,
      endDate: localEndDate,
      status: localStatus,
    });
  };

  const handleReset = () => {
    setLocalSearch("");
    setLocalStartDate("");
    setLocalEndDate("");
    setLocalStatus("all");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    searchParams.search ||
    searchParams.startDate ||
    searchParams.endDate ||
    (searchParams.status && searchParams.status !== "all");

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Riwayat Pemeriksaan
              </h1>
              <p className="text-slate-600 mt-1">
                Total {totalInspections} pemeriksaan |{" "}
                <span className="font-semibold">
                  Menampilkan {inspections.length} hasil
                </span>
              </p>
            </div>
            <Link
              href="/security/inspection/new"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">Pemeriksaan Baru</span>
              <span className="sm:hidden">Baru</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Pencarian
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Cari nomor kontainer, perusahaan, atau plat..."
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Status
                </label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="completed">Selesai</option>
                  <option value="pending">Pending Checker</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                <Search className="w-4 h-4" />
                {isPending ? "Mencari..." : "Terapkan Filter"}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reset Filter
                </button>
              )}
            </div>
          </form>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Filter Aktif:
              </p>
              <div className="flex flex-wrap gap-2">
                {searchParams.search && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                    Pencarian: {searchParams.search}
                  </span>
                )}
                {searchParams.startDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg">
                    Dari:
                    {new Date(searchParams.startDate).toLocaleDateString(
                      "id-ID"
                    )}
                  </span>
                )}
                {searchParams.endDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg">
                    Sampai:
                    {new Date(searchParams.endDate).toLocaleDateString("id-ID")}
                  </span>
                )}
                {searchParams.status && searchParams.status !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg">
                    Status:{" "}
                    {searchParams.status === "completed"
                      ? "Selesai"
                      : "Pending"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {inspections.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Tidak ada hasil ditemukan
              </h3>
              <p className="text-slate-600 mb-6">
                {hasActiveFilters
                  ? "Coba ubah filter atau reset untuk melihat semua data"
                  : "Belum ada pemeriksaan yang tercatat"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Hasil Pencarian
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {inspections.length} pemeriksaan ditemukan
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Export ke CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Kontainer
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                        Perusahaan
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                        No. Plat
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                        Tanggal
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inspections.map((inspection) => {
                      const hasChecker =
                        inspection.container.checkerData !== null;
                      return (
                        <tr
                          key={inspection.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {inspection.container.containerNo}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {inspection.container.sealNo}
                              </p>
                              <p className="text-xs text-slate-600 mt-1 md:hidden">
                                {inspection.container.companyName}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 hidden md:table-cell">
                            <p className="text-sm text-slate-900">
                              {inspection.container.companyName}
                            </p>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                            <p className="text-sm font-mono text-slate-700">
                              {inspection.container.plateNo}
                            </p>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs lg:text-sm">
                                {new Date(
                                  inspection.inspectionDate
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            {hasChecker ? (
                              <span className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                <span className="hidden sm:inline">
                                  Selesai
                                </span>
                                <span className="sm:hidden">✓</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg whitespace-nowrap">
                                <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                <span className="hidden sm:inline">
                                  Pending
                                </span>
                                <span className="sm:hidden">⏳</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <div className="flex items-center justify-end gap-1 lg:gap-2">
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
                              <button
                                className="p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
