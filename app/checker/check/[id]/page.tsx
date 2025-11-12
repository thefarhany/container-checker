import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import CheckerFormUnified from "@/components/checker/CheckerFormUnified";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";

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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                ⚠️ Kontainer Belum Diperiksa Security
              </h2>
              <p className="text-yellow-700">
                Kontainer harus diperiksa oleh Security terlebih dahulu sebelum
                Checker melakukan pemeriksaan.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (container.checkerData) {
    return (
      <DashboardLayout session={session}>
        <CheckerFormUnified
          mode="view"
          container={container}
          securityCheck={container.securityCheck}
          checkerData={container.checkerData}
          defaultCheckerName={container.checkerData.user?.name || ""}
          backLink="/checker/dashboard"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <CheckerFormUnified
        mode="submit"
        container={container}
        securityCheck={container.securityCheck}
        defaultCheckerName={session.name}
        backLink="/checker/dashboard"
      />
    </DashboardLayout>
  );
}
