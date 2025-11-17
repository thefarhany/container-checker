"use server";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function getInspectorNamesByRole(role: UserRole) {
  const inspectorNames = await prisma.inspectorName.findMany({
    where: {
      role: role,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  return inspectorNames;
}
