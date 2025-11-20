import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import InspectionFormUnified from "@/components/security/InspectionFormUnified";
import { Metadata } from "next";
import { getInspectorNamesByRole } from "@/app/actions/inspectorNames";

export const metadata: Metadata = {
  title: "Pemeriksaan Baru | Container Checker",
  description: "Dashboard pemeriksaan keamanan kontainer",
};

export default async function NewInspectionPage() {
  const session = await getSession();
  if (!session) return null;

  const categories = await prisma.checklistCategory.findMany({
    include: {
      items: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  // Fetch inspector names by role
  const inspectorNames = await getInspectorNamesByRole(session.role);

  return (
    <DashboardLayout session={session}>
      <InspectionFormUnified
        mode="create"
        categories={categories}
        userRole={session.role as "SECURITY"}
        inspectorNames={inspectorNames}
      />
    </DashboardLayout>
  );
}
