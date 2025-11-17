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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="text-2xl">⚠️</span>
            <h3 className="font-semibold">
              Kontainer Belum Diperiksa Security
            </h3>
          </div>
          <p className="mt-2 text-sm text-amber-700">
            Kontainer harus diperiksa oleh Security terlebih dahulu sebelum
            Checker melakukan pemeriksaan.
          </p>
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

  const historyByChecklistItem = new Map<string, typeof allHistories>();
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
