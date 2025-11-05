"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createInspection } from "@/app/actions/inspections";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ImageUploadClient from "@/components/security/inspection/ImageUploadClient";

interface Category {
  id: string;
  name: string;
  description: string | null;
  items: Array<{
    id: string;
    itemText: string;
    description: string | null;
  }>;
}

export default function InspectionForm({
  categories,
}: {
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    const loadingToast = toast.loading("Menyimpan data pemeriksaan...", {
      description: "Mohon tunggu, sedang mengupload foto dan menyimpan data",
    });

    startTransition(async () => {
      try {
        await createInspection(formData);
        toast.dismiss(loadingToast);
        toast.success("Data Container Berhasil Ditambahkan! ✓", {
          description: "Pemeriksaan kontainer telah disimpan ke database",
          duration: 5000,
        });
      } catch (error: unknown) {
        const err = error as { message?: string; digest?: string };

        if (
          err?.message === "NEXT_REDIRECT" ||
          err?.digest?.startsWith("NEXT_REDIRECT") ||
          (err?.message && String(err.message).includes("NEXT_REDIRECT"))
        ) {
          toast.dismiss(loadingToast);
          toast.success("Data Container Berhasil Ditambahkan! ✓", {
            description: "Pemeriksaan kontainer telah disimpan ke database",
            duration: 5000,
          });
          throw error;
        }

        toast.dismiss(loadingToast);
        toast.error("Gagal Menyimpan Data", {
          description:
            error instanceof Error ? error.message : "Terjadi kesalahan",
          duration: 5000,
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link
            href="/security/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Form Pemeriksaan Kontainer
          </h1>
          <p className="text-gray-600 mt-2">
            Isi formulir pemeriksaan dengan lengkap dan teliti
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form action={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informasi Kontainer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="containerNo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nomor Kontainer *
                </label>
                <input
                  type="text"
                  id="containerNo"
                  name="containerNo"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Contoh: CONT-2024-001"
                />
              </div>
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Nama perusahaan"
                />
              </div>
              <div>
                <label
                  htmlFor="sealNo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nomor Segel *
                </label>
                <input
                  type="text"
                  id="sealNo"
                  name="sealNo"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Nomor segel"
                />
              </div>
              <div>
                <label
                  htmlFor="plateNo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nomor Plat *
                </label>
                <input
                  type="text"
                  id="plateNo"
                  name="plateNo"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Nomor plat kendaraan"
                />
              </div>
              <div>
                <label
                  htmlFor="inspectionDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tanggal Pemeriksaan *
                </label>
                <input
                  type="date"
                  id="inspectionDate"
                  name="inspectionDate"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>
              <div>
                <label
                  htmlFor="inspectorName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nama Security Officer *
                </label>
                <input
                  type="text"
                  id="inspectorName"
                  name="inspectorName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Nama inspector"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Checklist Pemeriksaan
            </h2>
            <div className="space-y-6">
              {categories.map((category: Category, idx: number) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {category.description}
                    </p>
                  )}
                  <div className="space-y-3">
                    {category.items.map((item: Category["items"][number]) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          name={`response_${item.id}`}
                          value="true"
                          className="mt-1 w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.itemText}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Foto Pemeriksaan
            </h2>
            <ImageUploadClient />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Catatan Pemeriksaan (Opsional)
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tambahkan catatan atau keterangan tambahan jika diperlukan"
            />
          </div>

          <div className="flex gap-4">
            <Link
              href="/security/dashboard"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPending ? "Menyimpan..." : "Simpan Pemeriksaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
