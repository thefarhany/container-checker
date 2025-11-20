import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import InspectionFormUnified from "@/components/security/InspectionFormUnified";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getInspectorNamesByRole } from "@/app/actions/inspectorNames";

export const metadata: Metadata = {
  title: "Detail Pemeriksaan | Container Checker",
  description: "Dashboard pemeriksaan keamanan kontainer",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InspectionDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) return null;

  const resolvedParams = await params;

  // ✅ PERBAIKAN: Ambil inspection tanpa history dulu
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

  // ✅ PERBAIKAN: Ambil SEMUA history untuk security check ini berdasarkan checklistItemId
  const allHistories = await prisma.securityCheckResponseHistory.findMany({
    where: {
      securityCheckId: resolvedParams.id,
    },
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
  });

  // ✅ PERBAIKAN: Group history by checklistItemId
  const historyByChecklistItem = new Map<string, typeof allHistories>();
  allHistories.forEach((history) => {
    const existing = historyByChecklistItem.get(history.checklistItemId) || [];
    existing.push(history);
    historyByChecklistItem.set(history.checklistItemId, existing);
  });

  // ✅ PERBAIKAN: Inject history ke responses berdasarkan checklistItemId
  const responsesWithHistory = inspection.responses.map((response) => ({
    ...response,
    history: historyByChecklistItem.get(response.checklistItemId) || [],
  }));

  const categories = await prisma.checklistCategory.findMany({
    include: {
      items: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const inspectorNames = await getInspectorNamesByRole(session.role);

  return (
    <DashboardLayout session={session}>
      <InspectionFormUnified
        mode="view"
        categories={categories}
        inspection={{
          ...inspection,
          responses: responsesWithHistory,
        }}
        backLink="/security/dashboard"
        userRole={session.role as "SECURITY"}
        inspectorNames={inspectorNames}
      />
    </DashboardLayout>
  );
}
