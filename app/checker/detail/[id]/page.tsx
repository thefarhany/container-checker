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

export default async function ViewCheckerPage({ params }: PageProps) {
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

  if (!container.checkerData) {
    return (
      <DashboardLayout session={session}>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                ℹ️ Belum Ada Data Checker
              </h2>
              <p className="text-blue-700 mb-4">
                Kontainer ini belum diperiksa oleh Checker.
              </p>
              <a
                href="/checker/dashboard"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Kembali ke Dashboard
              </a>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <CheckerFormUnified
        mode="view"
        container={container}
        securityCheck={container.securityCheck || undefined}
        checkerData={container.checkerData}
        defaultCheckerName={container.checkerData.user?.name || ""}
        backLink="/checker/dashboard"
      />
    </DashboardLayout>
  );
}
