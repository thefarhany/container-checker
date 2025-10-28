"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, createSession, deleteSession } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi" };
  }

  const user = await verifyCredentials(email, password);

  if (!user) {
    return { error: "Email atau password salah" };
  }

  await createSession(user.id);

  // Redirect based on role
  if (user.role === "SECURITY") {
    redirect("/security/dashboard");
  } else if (user.role === "CHECKER") {
    redirect("/checker/dashboard");
  } else if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
