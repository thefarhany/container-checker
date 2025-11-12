import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import EditUserButton from "@/components/admin/users/EditUserButton";
import DeleteUserButton from "@/components/admin/users/DeleteUserButton";
import {
  Users,
  Shield,
  ClipboardCheck,
  UserCog,
  Mail,
  Calendar,
  Plus,
  LucideIcon,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen User | Container Checker",
  description: "Manajemen User",
};

async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
  bgGradient,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  iconColor: string;
  iconBg: string;
  bgGradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${bgGradient} p-6 shadow-lg`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
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

function getRoleBadge(role: string) {
  const styles = {
    ADMIN: "bg-orange-100 text-orange-800 border-orange-200",
    SECURITY: "bg-green-100 text-green-800 border-green-200",
    CHECKER: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const icons = {
    ADMIN: UserCog,
    SECURITY: Shield,
    CHECKER: ClipboardCheck,
  };

  const labels = {
    ADMIN: "Admin",
    SECURITY: "Security",
    CHECKER: "Checker",
  };

  const Icon = icons[role as keyof typeof icons];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        styles[role as keyof typeof styles]
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {labels[role as keyof typeof labels]}
    </span>
  );
}

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const users = await getUsers();
  const totalUsers = users.length;
  const securityCount = users.filter((u) => u.role === "SECURITY").length;
  const checkerCount = users.filter((u) => u.role === "CHECKER").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Manajemen Pengguna
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Kelola pengguna dan hak akses sistem
                </p>
              </div>

              {/* Tambah User Button */}
              <Link
                href="/admin/users/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 shadow-md hover:shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Tambah User
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Statistics Cards */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total User"
              value={totalUsers}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              bgGradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              icon={Shield}
              label="Security"
              value={securityCount}
              iconColor="text-green-600"
              iconBg="bg-green-100"
              bgGradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={ClipboardCheck}
              label="Checker"
              value={checkerCount}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              bgGradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              icon={UserCog}
              label="Admin"
              value={adminCount}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
              bgGradient="bg-gradient-to-br from-orange-500 to-orange-600"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Daftar Pengguna
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                {totalUsers} pengguna terdaftar
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      User
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Bergabung
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      {/* User Info */}
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-600">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate sm:hidden">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email - Hidden on mobile */}
                      <td className="hidden sm:table-cell px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-900 truncate max-w-xs">
                            {user.email}
                          </span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-3 sm:px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Join Date - Hidden on mobile */}
                      <td className="hidden md:table-cell px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(user.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <EditUserButton user={user} />
                          <DeleteUserButton
                            userId={user.id}
                            userName={user.name}
                            isCurrentUser={user.id === session.userId}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
