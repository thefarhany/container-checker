import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import InspectionFormUnified from "@/components/security/InspectionFormUnified";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getInspectorNamesByRole } from "@/app/actions/inspectorNames";

export const metadata: Metadata = {
  title: "Edit Pemeriksaan | Container Checker",
  description: "Dashboard pemeriksaan keamanan kontainer",
};

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
          history: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              changedAt: "desc",
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

  // Fetch inspector names by role
  const inspectorNames = await getInspectorNamesByRole(session.role);

  return (
    <DashboardLayout session={session}>
      <InspectionFormUnified
        mode="edit"
        categories={categories}
        inspection={inspection}
        userRole={session.role as "SECURITY"}
        inspectorNames={inspectorNames}
      />
    </DashboardLayout>
  );
}
