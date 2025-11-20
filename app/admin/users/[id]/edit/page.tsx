import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import UserForm from "@/components/admin/users/UserForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-4">
            <Link
              href="/admin/users"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Kembali ke Daftar User</span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-purple-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Edit User</h1>
              <p className="text-purple-100 text-sm mt-1">
                Perbarui data security atau checker
              </p>
            </div>

            <div className="p-6">
              <UserForm user={user} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
