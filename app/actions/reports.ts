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
            user: {
              select: {
                name: true,
              },
            },
            photos: {
              select: {
                url: true,
                filename: true,
              },
            },
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
                history: {
                  orderBy: {
                    changedAt: "desc",
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
            photos: {
              select: {
                url: true,
                filename: true,
              },
            },
          },
        },
      },
      orderBy: {
        inspectionDate: "desc",
      },
    });

    const containersWithHistory = await Promise.all(
      containers.map(async (container) => {
        if (!container.securityCheck) {
          return container;
        }

        const allHistories = await prisma.securityCheckResponseHistory.findMany(
          {
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
          }
        );

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
              : historyByVehicleItem.get(response.vehicleInspectionItemId) ||
                [],
          })
        );

        return {
          ...container,
          securityCheck: {
            ...container.securityCheck,
            responses: responsesWithHistory,
          },
        };
      })
    );

    let filtered = containersWithHistory;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.containerNo.toLowerCase().includes(searchLower) ||
          c.companyName.toLowerCase().includes(searchLower) ||
          (c.checkerData?.utcNo || "").toLowerCase().includes(searchLower) ||
          c.sealNo.toLowerCase().includes(searchLower) ||
          c.plateNo.toLowerCase().includes(searchLower)
      );
    }

    if (status === "completed") {
      filtered = filtered.filter((c) => c.securityCheck && c.checkerData);
    } else if (status === "pending-checker") {
      filtered = filtered.filter((c) => c.securityCheck && !c.checkerData);
    } else if (status === "pending-security") {
      filtered = filtered.filter((c) => !c.securityCheck);
    }

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
