"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, createSession, deleteSession } from "@/lib/auth";

export async function login(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email dan password wajib diisi");
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    throw new Error("Email atau password salah");
  }

  await createSession(user.id);

  if (user.role === "SECURITY") {
    redirect("/security/dashboard");
  } else if (user.role === "CHECKER") {
    redirect("/checker/dashboard");
  } else if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else {
    redirect("/");
  }
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
