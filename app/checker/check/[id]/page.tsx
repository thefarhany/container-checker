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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Kontainer Belum Diperiksa Security
            </h2>
            <p className="text-gray-600">
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
  allHistories.forEach((history) => {
    const existing = historyByChecklistItem.get(history.checklistItemId) || [];
    existing.push(history);
    historyByChecklistItem.set(history.checklistItemId, existing);
  });

  const responsesWithHistory = container.securityCheck.responses.map(
    (response) => ({
      ...response,
      history: historyByChecklistItem.get(response.checklistItemId) || [],
    })
  );

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
          securityInspectorName={container.securityCheck.inspectorName}
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
        securityInspectorName={container.securityCheck.inspectorName}
      />
    </DashboardLayout>
  );
}
