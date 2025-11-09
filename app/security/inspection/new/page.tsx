import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/Dashboard";
import InspectionFormUnified from "@/components/security/inspection/InspectionFormUnified";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Pengecekan Baru Security",
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

export default async function NewInspectionPage() {
  const session = await getSession();

  if (!session) return null;

  const categories = await prisma.checklistCategory.findMany({
    include: {
      items: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <DashboardLayout session={session}>
      <InspectionFormUnified
        mode="create"
        categories={categories as unknown as Category[]}
        defaultInspectorName={session.name}
        backLink="/security/dashboard"
      />
    </DashboardLayout>
  );
}
