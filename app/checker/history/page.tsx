import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import {
  Eye,
  Package,
  ClipboardCheck,
  Calendar,
  Building2,
  Truck,
  FileCheck,
  History,
} from "lucide-react";

async function getCompletedContainers() {
  const containers = await prisma.checkerData.findMany({
    include: {
      container: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return containers;
}

export default async function HistoryPage() {
  const session = await getSession();

  if (!session || session.role !== "CHECKER") {
    redirect("/login");
  }

  const checkedContainers = await getCompletedContainers();
  const totalChecked = checkedContainers.length;

  return (
    <DashboardLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <History className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Riwayat Pemeriksaan
              </h1>
              <p className="text-gray-600 mt-1">
                Total {totalChecked} kontainer telah diperiksa
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pemeriksaan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalChecked}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Bulan Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    checkedContainers.filter((c) => {
                      const date = new Date(c.createdAt);
                      const now = new Date();
                      return (
                        date.getMonth() === now.getMonth() &&
                        date.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    checkedContainers.filter((c) => {
                      const date = new Date(c.createdAt);
                      const today = new Date();
                      return date.toDateString() === today.toDateString();
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Container List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Daftar Kontainer yang Telah Diperiksa
            </h2>
          </div>

          <div className="overflow-x-auto">
            {checkedContainers.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      No. Kontainer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      No. UTC
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Perusahaan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      No. Plat
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Diperiksa Oleh
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
                  {checkedContainers.map((checked, index) => (
                    <tr
                      key={checked.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {checked.container.containerNo}
                            </p>
                            <p className="text-xs text-gray-500">
                              Segel: {checked.container.sealNo}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-purple-600" />
                          <span className="font-mono font-semibold text-purple-900 bg-purple-50 px-2 py-1 rounded text-sm">
                            {checked.utcNo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {checked.container.companyName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {checked.container.plateNo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {checked.user?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-sm text-gray-700">
                            {checked.user?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(checked.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(checked.createdAt).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/checker/detail/${checked.containerId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum Ada Riwayat
                </h3>
                <p className="text-gray-500 mb-6">
                  Belum ada kontainer yang telah diperiksa
                </p>
                <Link
                  href="/checker/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Ke Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Pagination Info (Optional - untuk future) */}
        {checkedContainers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600">
              Menampilkan{" "}
              <span className="font-semibold">{checkedContainers.length}</span>{" "}
              dari <span className="font-semibold">{totalChecked}</span> data
            </p>
            <p className="text-sm text-gray-500">
              Terakhir diperbarui:{" "}
              {checkedContainers.length > 0
                ? new Date(checkedContainers[0].createdAt).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "-"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
