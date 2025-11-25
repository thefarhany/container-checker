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

  // ✅ TIDAK DIUBAH: Ambil inspection tanpa history dulu
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
          // ✅ TAMBAHAN: Include vehicleInspectionItem juga
          vehicleInspectionItem: {
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

  // ✅ TIDAK DIUBAH: Ambil SEMUA history untuk security check ini
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

  // ✅ PERUBAHAN: Group history by checklistItemId AND vehicleInspectionItemId
  const historyByChecklistItem = new Map();
  const historyByVehicleItem = new Map();

  allHistories.forEach((history) => {
    if (history.checklistItemId) {
      const existing =
        historyByChecklistItem.get(history.checklistItemId) || [];
      existing.push(history);
      historyByChecklistItem.set(history.checklistItemId, existing);
    }

    // ✅ TAMBAHAN: Group history for vehicle items
    if (history.vehicleInspectionItemId) {
      const existing =
        historyByVehicleItem.get(history.vehicleInspectionItemId) || [];
      existing.push(history);
      historyByVehicleItem.set(history.vehicleInspectionItemId, existing);
    }
  });

  // ✅ PERUBAHAN: Inject history ke responses untuk checklist dan vehicle
  const responsesWithHistory = inspection.responses.map((response) => ({
    ...response,
    history: response.checklistItemId
      ? historyByChecklistItem.get(response.checklistItemId) || []
      : historyByVehicleItem.get(response.vehicleInspectionItemId) || [],
  }));

  // ✅ TIDAK DIUBAH: Fetch categories
  const categories = await prisma.checklistCategory.findMany({
    include: {
      items: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  // ✅ TAMBAHAN: Fetch vehicle categories
  const vehicleCategories = await prisma.vehicleInspectionCategory.findMany({
    include: {
      items: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  // ✅ TIDAK DIUBAH: Fetch inspector names
  const inspectorNames = await getInspectorNamesByRole(session.role);

  return (
    <DashboardLayout session={session}>
      <InspectionFormUnified
        userRole="SECURITY"
        mode="view"
        categories={categories}
        vehicleCategories={vehicleCategories}
        inspection={{
          ...inspection,
          responses: responsesWithHistory,
        }}
        inspectorNames={inspectorNames}
      />
    </DashboardLayout>
  );
}
