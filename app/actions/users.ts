"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized: Hanya admin yang bisa menambah user" };
  }

  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const role = formData.get("role") as "SECURITY" | "CHECKER" | "ADMIN";

    // Validation
    if (!name || !email || !password || !role) {
      return { error: "Semua field harus diisi" };
    }

    if (password !== confirmPassword) {
      return { error: "Password dan konfirmasi password tidak cocok" };
    }

    if (password.length < 6) {
      return { error: "Password minimal 6 karakter" };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email sudah terdaftar" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    revalidatePath("/admin/users");

    // Return success instead of redirect
    return { success: true };
  } catch (error) {
    console.error("❌ Error creating user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Unique constraint")) {
      return { error: "Email sudah terdaftar" };
    }
    return {
      error: `Gagal membuat user: ${errorMessage}`,
    };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "SECURITY" | "CHECKER" | "ADMIN";

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "User tidak ditemukan" };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
    });

    if (existingUser) {
      return { error: "Email sudah digunakan user lain" };
    }

    const updateData: {
      name: string;
      email: string;
      role: "SECURITY" | "CHECKER" | "ADMIN";
      password?: string;
    } = {
      name,
      email,
      role,
    };

    if (password && password.length > 0) {
      if (password.length < 6) {
        return { error: "Password minimal 6 karakter" };
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Gagal mengupdate user: ${errorMessage}` };
  }
}

export async function deleteUser(userId: string) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "User tidak ditemukan" };
    }

    if (user.id === session.userId) {
      return { error: "Tidak dapat menghapus akun sendiri" };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Gagal menghapus user: ${errorMessage}` };
  }
}
