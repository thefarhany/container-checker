"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { deleteUser } from "@/app/actions/users";
import { useRouter } from "next/navigation";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  isCurrentUser: boolean;
}

export default function DeleteUserButton({
  userId,
  userName,
  isCurrentUser,
}: DeleteUserButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteUser(userId);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  // Disable delete for current user
  if (isCurrentUser) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-300 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-500 cursor-not-allowed opacity-60"
        title="Tidak dapat menghapus akun sendiri"
      >
        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Hapus</span>
      </button>
    );
  }

  return (
    <>
      {/* Delete Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-red-700 shadow-sm hover:shadow-md"
      >
        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Hapus</span>
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Konfirmasi Hapus
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="text-center">
                <p className="text-gray-700">
                  Apakah Anda yakin ingin menghapus user{" "}
                  <span className="font-bold text-gray-900">{userName}</span>?
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Tindakan ini tidak dapat dibatalkan. Semua data yang terkait
                  dengan user ini akan dihapus secara permanen.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
