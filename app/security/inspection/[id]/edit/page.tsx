import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import InspectionFormUnified from "@/components/security/inspection/InspectionFormUnified";
import { notFound } from "next/navigation";

interface ChecklistItem {
  id: string;
  itemText: string;
  description: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  order: number;
  items: ChecklistItem[];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInspectionPage({ params }: PageProps) {
  const session = await getSession();

  if (!session) return null;

  const resolvedParams = await params;

  // Fetch inspection dengan semua relasi
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
      <InspectionFormUnified
        mode="edit"
        categories={categories as unknown as Category[]}
        inspection={inspection}
        backLink={`/security/dashboard`}
      />
    </DashboardLayout>
  );
}
