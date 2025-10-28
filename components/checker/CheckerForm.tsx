"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploadClient from "@/components/checker/ImageUploadClient";
import { submitCheckerData } from "@/app/actions/checker";
import { Shield, AlertCircle } from "lucide-react";

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

    // Validate photos
    if (images.length === 0) {
      setError("Minimal 1 foto harus diupload");
      return;
    }

    const formData = new FormData(e.currentTarget);

    // Add photos to FormData
    images.forEach((image) => {
      formData.append("photos", image);
    });

    console.log("🚀 Submitting form...");
    console.log("   Container ID:", containerId);
    console.log("   UTC No:", formData.get("utcNo"));
    console.log("   Photos:", images.length);
    console.log("   Remarks:", formData.get("remarks"));

    startTransition(async () => {
      try {
        const result = await submitCheckerData(containerId, formData);

        console.log("📥 Server response:", result);

        if (result?.error) {
          setError(result.error);
          console.error("❌ Server error:", result.error);
        } else {
          console.log("✅ Success! Redirecting...");
          // Server action will handle redirect
        }
      } catch (err: any) {
        console.error("❌ Form submission error:", err);
        setError(err.message || "Terjadi kesalahan saat menyimpan data");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Gagal menyimpan data
              </p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section: Input Data Checker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-lg font-bold text-white mb-1">
            Input Data Checker
          </h2>
          <p className="text-sm text-blue-100">
            Tambahkan nomor UTC dan foto dokumentasi untuk kontainer{" "}
            {containerNo}
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Nomor UTC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor UTC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="utcNo"
              required
              placeholder="Contoh: UTC2025350"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-2">
              Masukkan nomor UTC yang unik dan belum pernah digunakan
            </p>
          </div>

          {/* Upload Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Foto Checker <span className="text-red-500">*</span>
            </label>
            <ImageUploadClient onImagesChange={setImages} maxImages={10} />
            {images.length === 0 && (
              <p className="text-xs text-red-500 mt-2">
                * Minimal 1 foto harus diupload
              </p>
            )}
            {images.length > 0 && (
              <p className="text-xs text-green-600 mt-2">
                ✓ {images.length} foto siap diupload
              </p>
            )}
          </div>

          {/* Catatan Checker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Checker (Opsional)
            </label>
            <textarea
              name="remarks"
              rows={4}
              placeholder="Tambahkan catatan atau temuan penting dari pemeriksaan Anda..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
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
          disabled={isPending || images.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shield className="w-5 h-5" />
          {isPending ? "Menyimpan..." : "Simpan Pemeriksaan"}
        </button>
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">
                  Menyimpan Data Checker
                </p>
                <p className="text-sm text-gray-600">
                  Sedang mengupload {images.length} foto dan menyimpan data...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
