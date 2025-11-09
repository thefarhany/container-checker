"use client";

import { useState, startTransition } from "react";
import { toast } from "sonner";
import { login } from "@/app/actions/auth";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const loadingToast = toast.loading("Memproses login...");

    startTransition(async () => {
      try {
        await login(formData);

        toast.dismiss(loadingToast);
        toast.success("Login berhasil! ✓", {
          description: "Mengalihkan ke dashboard...",
          duration: 3000,
        });
      } catch (error: unknown) {
        const err = error as {
          message?: string;
          digest?: string;
        };

        if (
          err?.message === "NEXT_REDIRECT" ||
          err?.digest?.startsWith("NEXT_REDIRECT") ||
          (err?.message && String(err.message).includes("NEXT_REDIRECT"))
        ) {
          toast.dismiss(loadingToast);
          toast.success("Login berhasil! ✓", {
            description: "Mengalihkan ke dashboard...",
            duration: 3000,
          });
          throw error;
        }

        toast.dismiss(loadingToast);
        toast.error("Login gagal", {
          description:
            error instanceof Error ? error.message : "Terjadi kesalahan",
          duration: 5000,
        });
        setIsLoading(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="your@mail.com"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Password"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Loading..." : "Sign in"}
      </button>
    </form>
  );
}
