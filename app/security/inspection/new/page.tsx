import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import InspectionForm from "@/components/security/inspection/InspectionForm";

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

  return (
    <DashboardLayout session={session}>
      <InspectionForm categories={categories} />
    </DashboardLayout>
  );
}
