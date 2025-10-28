"use client";

import { useState, useTransition } from "react";
import { Edit, X, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { updateUser } from "@/app/actions/users";
import { useRouter } from "next/navigation";
import { Shield, ClipboardCheck, UserCog } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "SECURITY" | "CHECKER" | "ADMIN";
}

type RoleType = "SECURITY" | "CHECKER" | "ADMIN";

export default function EditUserButton({ user }: { user: User }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>(user.role);

  const roles = [
    {
      value: "SECURITY" as RoleType,
      label: "Security",
      description: "Pemeriksaan awal kontainer",
      icon: Shield,
      color: {
        border: "border-green-200",
        hoverBorder: "hover:border-green-400",
        selectedBorder: "border-green-500",
        selectedBg: "bg-green-50",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        selectedIconBg: "bg-green-500",
        selectedIconColor: "text-white",
      },
    },
    {
      value: "CHECKER" as RoleType,
      label: "Checker",
      description: "Verifikasi akhir kontainer",
      icon: ClipboardCheck,
      color: {
        border: "border-purple-200",
        hoverBorder: "hover:border-purple-400",
        selectedBorder: "border-purple-500",
        selectedBg: "bg-purple-50",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        selectedIconBg: "bg-purple-500",
        selectedIconColor: "text-white",
      },
    },
    {
      value: "ADMIN" as RoleType,
      label: "Admin",
      description: "Akses penuh sistem",
      icon: UserCog,
      color: {
        border: "border-orange-200",
        hoverBorder: "hover:border-orange-400",
        selectedBorder: "border-orange-500",
        selectedBg: "bg-orange-50",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        selectedIconBg: "bg-orange-500",
        selectedIconColor: "text-white",
      },
    },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateUser(user.id, formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* Edit Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-sm hover:shadow-md"
      >
        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Edit</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Perbarui informasi pengguna
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-800">
                        Gagal update user
                      </h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Card */}
              <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Informasi User
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Update data user dengan benar
                  </p>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={user.name}
                    disabled={isPending}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={user.email}
                    disabled={isPending}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email akan digunakan untuk login ke sistem
                  </p>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Role / Jabatan *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === role.value;

                      return (
                        <div
                          key={role.value}
                          onClick={() =>
                            !isPending && setSelectedRole(role.value)
                          }
                          className={`
                            relative p-4 border-2 rounded-lg cursor-pointer transition-all
                            ${
                              isSelected
                                ? `${role.color.selectedBorder} ${role.color.selectedBg} shadow-md`
                                : `${role.color.border} ${role.color.hoverBorder} hover:shadow-sm`
                            }
                            ${isPending ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={selectedRole === role.value}
                            onChange={() => setSelectedRole(role.value)}
                            required
                            disabled={isPending}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                                p-2.5 rounded-lg transition-all
                                ${
                                  isSelected
                                    ? `${role.color.selectedIconBg}`
                                    : `${role.color.iconBg}`
                                }
                              `}
                            >
                              <Icon
                                className={`h-5 w-5 ${
                                  isSelected
                                    ? role.color.selectedIconColor
                                    : role.color.iconColor
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                {role.label}
                              </div>
                              <div className="text-sm text-gray-600">
                                {role.description}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Password (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Password Baru{" "}
                    <span className="text-xs font-normal text-gray-500">
                      (Opsional - Kosongkan jika tidak ingin mengubah)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      disabled={isPending}
                      placeholder="Masukkan password baru (minimal 6 karakter)"
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg text-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isPending}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
