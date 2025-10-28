import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardLayout from "@/components/Dashboard";
import CreateUserForm from "@/components/admin/CreateUserForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewUserPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tambah User Baru
            </h1>
            <p className="text-gray-600 mt-1">
              Buat akun pengguna baru untuk sistem
            </p>
          </div>
        </div>

        {/* Form */}
        <CreateUserForm />
      </div>
    </DashboardLayout>
  );
}
