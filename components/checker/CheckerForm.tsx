"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploadClient from "@/components/checker/ImageUploadClient";
import { submitCheckerData } from "@/app/actions/checker";
import { Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CheckerFormProps {
  containerId: string;
  containerNo: string;
}

export default function CheckerForm({
  containerId,
  containerNo,
}: CheckerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError("Minimal 1 foto harus diupload");
      toast.error("Validasi Gagal", {
        description: "Minimal 1 foto harus diupload",
        duration: 4000,
      });
      return;
    }

    const formData = new FormData(e.currentTarget);

    images.forEach((image) => {
      formData.append("photos", image);
    });

    const loadingToast = toast.loading("Menyimpan data checker...", {
      description: `Sedang mengupload ${images.length} foto dan menyimpan data`,
    });

    startTransition(async () => {
      try {
        await submitCheckerData(containerId, formData);

        toast.dismiss(loadingToast);
        toast.success("Data Checker Berhasil Disimpan! ✓", {
          description: "Pemeriksaan checker telah disimpan ke database",
          duration: 5000,
        });
      } catch (err: unknown) {
        const error = err as { message?: string; digest?: string };

        if (
          error?.message === "NEXT_REDIRECT" ||
          error?.digest?.startsWith("NEXT_REDIRECT") ||
          (error?.message && String(error.message).includes("NEXT_REDIRECT"))
        ) {
          toast.dismiss(loadingToast);
          toast.success("Data Checker Berhasil Disimpan! ✓", {
            description: "Pemeriksaan checker telah disimpan ke database",
            duration: 5000,
          });
          throw err;
        }

        setError(error?.message || "Terjadi kesalahan saat menyimpan data");
        toast.dismiss(loadingToast);
        toast.error("Gagal Menyimpan Data", {
          description:
            error?.message || "Terjadi kesalahan saat menyimpan data",
          duration: 5000,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">
                Gagal menyimpan data
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Input Data Checker
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Tambahkan nomor UTC dan foto dokumentasi untuk kontainer{" "}
              <span className="font-semibold text-gray-900">{containerNo}</span>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="utcNo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nomor UTC *
            </label>
            <input
              type="text"
              id="utcNo"
              name="utcNo"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              placeholder="Contoh: UTC-2024-001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Masukkan nomor UTC yang unik dan belum pernah digunakan
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Foto Checker *
            </label>
            <ImageUploadClient images={images} setImages={setImages} />
            {images.length === 0 && (
              <p className="text-xs text-red-600 mt-2">
                * Minimal 1 foto harus diupload
              </p>
            )}
            {images.length > 0 && (
              <p className="text-xs text-green-600 mt-2">
                ✓ {images.length} foto siap diupload
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Catatan Checker (Opsional)
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              placeholder="Tambahkan catatan atau keterangan tambahan jika diperlukan"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? "Menyimpan..." : "Simpan Pemeriksaan"}
        </button>
      </div>

      {isPending && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              Menyimpan Data Checker
            </h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              Sedang mengupload {images.length} foto dan menyimpan data...
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
