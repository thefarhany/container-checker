import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import CheckerFormUnified from "@/components/checker/CheckerFormUnified";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { getInspectorNamesByRole } from "@/app/actions/inspectorNames";

export const metadata: Metadata = {
  title: "Detail Container | Container Checker",
  description: "Detail pemeriksaan kondisi kontainer",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewCheckerDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "CHECKER") {
    redirect("/");
  }

  const resolvedParams = await params;

  const container = await prisma.container.findUnique({
    where: { id: resolvedParams.id },
    include: {
      securityCheck: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
          photos: true,
          responses: {
            include: {
              checklistItem: {
                include: {
                  category: true,
                },
              },
              vehicleInspectionItem: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: {
              checklistItem: {
                order: "asc",
              },
            },
          },
        },
      },
      checkerData: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
          photos: true,
        },
      },
    },
  });

  if (!container || !container.securityCheck) {
    notFound();
  }

  const allHistories = await prisma.securityCheckResponseHistory.findMany({
    where: {
      securityCheckId: container.securityCheck.id,
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

  const historyByChecklistItem = new Map();
  const historyByVehicleItem = new Map();

  allHistories.forEach((history) => {
    if (history.checklistItemId) {
      const existing =
        historyByChecklistItem.get(history.checklistItemId) || [];
      existing.push(history);
      historyByChecklistItem.set(history.checklistItemId, existing);
    }

    if (history.vehicleInspectionItemId) {
      const existing =
        historyByVehicleItem.get(history.vehicleInspectionItemId) || [];
      existing.push(history);
      historyByVehicleItem.set(history.vehicleInspectionItemId, existing);
    }
  });

  const responsesWithHistory = container.securityCheck.responses.map(
    (response) => ({
      ...response,
      history: response.checklistItemId
        ? historyByChecklistItem.get(response.checklistItemId) || []
        : historyByVehicleItem.get(response.vehicleInspectionItemId) || [],
    })
  ) as any;

  const inspectorNames = await getInspectorNamesByRole("CHECKER");

  return (
    <DashboardLayout session={session}>
      <CheckerFormUnified
        mode="view"
        container={container}
        securityCheck={{
          ...container.securityCheck,
          responses: responsesWithHistory,
        }}
        checkerData={container.checkerData || undefined}
        inspectorNames={inspectorNames}
      />
    </DashboardLayout>
  );
}
