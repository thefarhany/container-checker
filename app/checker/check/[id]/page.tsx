import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import CheckerFormUnified from "@/components/checker/CheckerFormUnified";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { getInspectorNamesByRole } from "@/app/actions/inspectorNames";

export const metadata: Metadata = {
  title: "Pemeriksaan Checker | Container Checker",
  description: "Pemeriksaan kondisi kontainer",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubmitCheckerPage({ params }: PageProps) {
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

  if (!container) {
    notFound();
  }

  if (!container.securityCheck) {
    return (
      <DashboardLayout session={session}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="text-yellow-500 text-4xl mr-4">⚠️</div>
              <h2 className="text-2xl font-bold text-yellow-800">
                Kontainer Belum Diperiksa Security
              </h2>
            </div>
            <p className="text-gray-700 text-lg">
              Kontainer harus diperiksa oleh Security terlebih dahulu sebelum
              Checker melakukan pemeriksaan.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
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

  if (container.checkerData) {
    return (
      <DashboardLayout session={session}>
        <CheckerFormUnified
          mode="view"
          container={container}
          securityCheck={{
            ...container.securityCheck,
            responses: responsesWithHistory,
          }}
          checkerData={container.checkerData}
          inspectorNames={inspectorNames}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <CheckerFormUnified
        mode="create"
        container={container}
        securityCheck={{
          ...container.securityCheck,
          responses: responsesWithHistory,
        }}
        inspectorNames={inspectorNames}
      />
    </DashboardLayout>
  );
}
