"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export async function createInspectorName(data: {
  name: string;
  role: UserRole;
  isActive: boolean;
}) {
  await prisma.inspectorName.create({
    data,
  });
  revalidatePath("/admin/users");
}

export async function updateInspectorName(
  id: string,
  data: {
    name: string;
    role: UserRole;
    isActive: boolean;
  }
) {
  await prisma.inspectorName.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

export async function deleteInspectorName(formData: FormData) {
  const id = formData.get("id") as string;

  await prisma.inspectorName.delete({
    where: { id },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
