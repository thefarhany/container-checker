import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateInspection } from "@/app/actions/inspections";
import DashboardLayout from "@/components/Dashboard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ImageUploadClient from "@/components/security/inspection/edit/ImageUploadClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInspectionPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) return null;

  const resolvedParams = await params;

  // Fetch inspection data
  const inspection = await prisma.securityCheck.findUnique({
    where: { id: resolvedParams.id },
    include: {
      container: true,
      photos: true,
      responses: {
        include: {
          checklistItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!inspection || inspection.userId !== session.userId) {
    notFound();
  }

  const categories = await prisma.checklistCategory.findMany({
    include: {
      items: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const responseMap = inspection.responses.reduce((acc: any, response: any) => {
    acc[response.checklistItemId] = response;
    return acc;
  }, {});

  return (
    <DashboardLayout session={session}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/security/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Pemeriksaan Kontainer
              </h1>
              <p className="text-gray-600 mt-1">
                Perbarui informasi pemeriksaan dengan lengkap dan teliti
              </p>
            </div>
          </div>
        </div>

        <form
          action={updateInspection.bind(null, resolvedParams.id)}
          className="space-y-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-semibold">
                1
              </div>
              <h2 className="text-lg font-semibold text-white">
                Informasi Kontainer
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  defaultValue={inspection.container.companyName}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                  placeholder="PT. Nama Perusahaan"
                />
              </div>

              {/* No. Kontainer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Kontainer *
                </label>
                <input
                  type="text"
                  name="containerNo"
                  required
                  defaultValue={inspection.container.containerNo}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                  placeholder="ABCD1234567"
                />
              </div>

              {/* No. Segel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Segel *
                </label>
                <input
                  type="text"
                  name="sealNo"
                  required
                  defaultValue={inspection.container.sealNo}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                  placeholder="SEAL123456"
                />
              </div>

              {/* No. Plat Kendaraan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Plat Kendaraan *
                </label>
                <input
                  type="text"
                  name="plateNo"
                  required
                  defaultValue={inspection.container.plateNo}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                  placeholder="B 1234 XYZ"
                />
              </div>

              {/* Tanggal Pemeriksaan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Pemeriksaan *
                </label>
                <input
                  type="datetime-local"
                  name="inspectionDate"
                  required
                  defaultValue={new Date(inspection.inspectionDate)
                    .toISOString()
                    .slice(0, 16)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                />
              </div>

              {/* Nama Pemeriksa */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Pemeriksa *
                </label>
                <input
                  type="text"
                  name="inspectorName"
                  required
                  defaultValue={inspection.inspectorName}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                  placeholder="Nama lengkap pemeriksa"
                />
              </div>
            </div>
          </div>

          {/* Checklist */}
          {categories.map((category: any, idx: number) => {
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-semibold">
                    {idx + 2}
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {category.name}
                  </h2>
                </div>

                {category.description && (
                  <div className="px-6 pt-4 pb-2 bg-blue-50 border-b border-blue-100">
                    <p className="text-sm text-blue-700">
                      {category.description}
                    </p>
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {category.items.map((item: any) => {
                    const response = responseMap[item.id];
                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            name={`checklist_${item.id}`}
                            id={`checklist_${item.id}`}
                            defaultChecked={response?.checked || false}
                            className="mt-1 w-5 h-5 text-black border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`checklist_${item.id}`}
                              className="block font-medium text-gray-900 cursor-pointer"
                            >
                              {item.itemText}
                            </label>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.description}
                              </p>
                            )}
                            <textarea
                              name={`notes_${item.id}`}
                              defaultValue={response?.notes || ""}
                              placeholder="Tambahkan catatan (opsional)"
                              className="mt-3 w-full px-3 py-2 text-sm border text-black border-gray-300 rounded-lg resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Photo Upload Section */}
          <ImageUploadClient existingPhotos={inspection.photos} />

          {/* Remarks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Tambahan
            </label>
            <textarea
              name="remarks"
              defaultValue={inspection.remarks || ""}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black resize-none"
              placeholder="Tambahkan catatan khusus atau temuan penting lainnya..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link
              href="/security/dashboard"
              className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
