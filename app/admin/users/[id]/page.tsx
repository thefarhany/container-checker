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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewUserPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const resolvedParams = await params;

  const user = await prisma.inspectorName.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!user) {
    redirect("/admin/users");
  }

  return (
    <DashboardLayout session={session}>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/admin/users"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Kembali ke Daftar User</span>
            </Link>
            <Link
              href={`/admin/users/${resolvedParams.id}/edit`}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              <span className="font-medium">Edit User</span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Detail User</h1>
            <p className="text-gray-600 mt-2">Informasi lengkap user</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Briefcase className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.isActive ? "Aktif" : "Non-Aktif"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Tanggal Dibuat
                    </label>
                    <div className="text-base font-semibold text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Terakhir Diupdate
                    </label>
                    <div className="text-base font-semibold text-gray-900">
                      {new Date(user.updatedAt).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      ID User
                    </label>
                    <div className="text-base font-mono text-gray-900 break-all">
                      {user.id}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Info:</span> User ini dapat
                  digunakan sebagai inspector dalam proses pengecekan container.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
