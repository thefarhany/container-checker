import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import UserForm from "@/components/admin/users/UserForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function EditUserPage({
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
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar User
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600 mt-2">
            Perbarui data security atau checker
          </p>
        </div>

        <UserForm user={user} />
      </div>
    </DashboardLayout>
  );
}
