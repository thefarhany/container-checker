import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  Pencil,
} from "lucide-react";

export default async function ViewUserPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const user = await prisma.inspectorName.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    redirect("/admin/users");
  }

  return (
    <DashboardLayout session={session}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar User
          </Link>
          <Link
            href={`/admin/users/${user.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
          >
            <Pencil className="w-4 h-4" />
            Edit User
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detail User</h1>
          <p className="text-gray-600 mt-2">Informasi lengkap user</p>
        </div>

        {/* User Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Header with gradient */}
          <div
            className={`h-32 ${
              user.role === "SECURITY"
                ? "bg-gradient-to-br from-purple-500 to-purple-600"
                : "bg-gradient-to-br from-green-500 to-green-600"
            }`}
          ></div>

          {/* Content */}
          <div className="px-8 pb-8 -mt-16">
            <div className="bg-white border-4 border-white w-24 h-24 rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <User className="w-12 h-12 text-gray-400" />
            </div>

            <div className="space-y-6">
              {/* Name and Role */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                    user.role === "SECURITY"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {user.role}
                </span>
              </div>

              <div className="h-px bg-gray-200"></div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4" />
                    Status
                  </div>
                  <div className="font-medium">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.isActive ? "Aktif" : "Non-Aktif"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Tanggal Dibuat
                  </div>
                  <div className="font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    Terakhir Diupdate
                  </div>
                  <div className="font-medium text-gray-900">
                    {new Date(user.updatedAt).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    ID User
                  </div>
                  <div className="font-mono text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded">
                    {user.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800">
              User ini dapat digunakan sebagai inspector dalam proses pengecekan
              container.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
