import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import CheckerFormUnified from "@/components/checker/CheckerFormUnified";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";

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

  // ✅ Fetch history (SAMA seperti /check/[id])
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
        inspectorNames={[]}
        securityInspectorName={container.securityCheck.inspectorName}
      />
    </DashboardLayout>
  );
}
