import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import EditInspectionForm from "@/components/security/inspection/edit/EditInspectionForm";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInspectionPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) return null;

  const resolvedParams = await params;

  // Fetch inspection data
  const inspection = await prisma.securityCheck.findUnique({
    where: { id: resolvedParams.id },
    include: {
      container: true,
      photos: true,
      responses: {
        include: {
          checklistItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!inspection || inspection.userId !== session.userId) {
    notFound();
  }

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
      <EditInspectionForm inspection={inspection} categories={categories} />
    </DashboardLayout>
  );
}
