"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createInspectorName, updateInspectorName } from "@/app/actions/users";
import { User, Briefcase, ToggleLeft } from "lucide-react";
import { UserRole } from "@prisma/client";

type UserFormProps = {
  user?: {
    id: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  };
};

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    role: user?.role || UserRole.CHECKER,
    isActive: user?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user) {
        await updateInspectorName(user.id, formData);
      } else {
        await createInspectorName(formData);
      }
      router.push("/admin/users");
      router.refresh();
    } catch {
      alert("Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
        {/* Nama User */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Nama Lengkap
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            placeholder="Masukkan nama lengkap user"
          />
          <p className="text-xs text-gray-600 mt-1.5">
            Nama akan digunakan sebagai inspector dalam sistem
          </p>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Role
            <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, role: UserRole.SECURITY })
              }
              className={`p-4 border-2 rounded-lg transition-all ${
                formData.role === UserRole.SECURITY
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:border-purple-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.role === UserRole.SECURITY
                      ? "border-purple-500"
                      : "border-gray-300"
                  }`}
                >
                  {formData.role === UserRole.SECURITY && (
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Security</div>
                  <div className="text-xs text-gray-600">Petugas keamanan</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, role: UserRole.CHECKER })
              }
              className={`p-4 border-2 rounded-lg transition-all ${
                formData.role === UserRole.CHECKER
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-green-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.role === UserRole.CHECKER
                      ? "border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {formData.role === UserRole.CHECKER && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Checker</div>
                  <div className="text-xs text-gray-600">Petugas pemeriksa</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ToggleLeft className="w-4 h-4" />
            Status User
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-900">
              {formData.isActive ? "Aktif" : "Non-Aktif"}
            </span>
          </label>
          <p className="text-xs text-gray-600 mt-1.5">
            User yang non-aktif tidak dapat digunakan dalam sistem
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? "Menyimpan..." : user ? "Update User" : "Tambah User"}
        </button>
      </div>
    </form>
  );
}
