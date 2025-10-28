"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getReportData(filters: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const { status, dateFrom, dateTo, search } = filters;

    const containers = await prisma.container.findMany({
      include: {
        securityCheck: {
          include: {
            user: { select: { name: true } },
            photos: true,
          },
        },
        checkerData: {
          include: {
            user: { select: { name: true } },
            photos: true,
          },
        },
      },
      orderBy: {
        inspectionDate: "desc",
      },
    });

    let filtered = containers;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.containerNo.toLowerCase().includes(searchLower) ||
          c.companyName.toLowerCase().includes(searchLower) ||
          (c.checkerData?.utcNo || "").toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (status === "completed") {
      filtered = filtered.filter((c) => c.securityCheck && c.checkerData);
    } else if (status === "pending-checker") {
      filtered = filtered.filter((c) => c.securityCheck && !c.checkerData);
    } else if (status === "pending-security") {
      filtered = filtered.filter((c) => !c.securityCheck);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((c) => new Date(c.inspectionDate) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((c) => new Date(c.inspectionDate) <= toDate);
    }

    return { data: filtered };
  } catch (error) {
    console.error("Error getting report data:", error);
    return { error: "Failed to get report data" };
  }
}
