import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import {
  UserPlus,
  Eye,
  Pencil,
  Users,
  Shield,
  ClipboardCheck,
} from "lucide-react";
import DeleteButton from "@/components/admin/users/DeleteButton";

async function getInspectorNames() {
  return await prisma.inspectorName.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const users = await getInspectorNames();
  const securityCount = users.filter((u) => u.role === "SECURITY").length;
  const checkerCount = users.filter((u) => u.role === "CHECKER").length;

  return (
    <DashboardLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-black font-bold">Manajemen User</h1>
            <p className="text-gray-600 mt-2">
              Kelola data security dan checker
            </p>
          </div>
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Tambah User
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total User</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Security</p>
                <p className="text-3xl font-bold text-gray-900">
                  {securityCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ClipboardCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Checker</p>
                <p className="text-3xl font-bold text-gray-900">
                  {checkerCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    No
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Nama User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Belum ada data user
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === "SECURITY"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {user.role === "SECURITY" ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <ClipboardCheck className="w-3 h-3" />
                          )}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.isActive ? "Aktif" : "Non-Aktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <DeleteButton id={user.id} name={user.name} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
