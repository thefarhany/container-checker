"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/app/actions/users";
import {
  User,
  Mail,
  Lock,
  Shield,
  ClipboardCheck,
  UserCog,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  CheckCircle,
} from "lucide-react";

type RoleType = "SECURITY" | "CHECKER" | "ADMIN";

export default function CreateUserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createUser(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        // Redirect on success
        router.push("/admin/users");
      }
    });
  };

  const roles = [
    {
      value: "SECURITY" as RoleType,
      label: "Security",
      description: "Pemeriksaan awal kontainer",
      icon: Shield,
      color: {
        bg: "bg-green-50",
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
        bg: "bg-purple-50",
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
        bg: "bg-orange-50",
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

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-shake">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Gagal membuat user
                </p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-100">
            <h2 className="text-lg font-bold text-gray-900">Informasi User</h2>
            <p className="text-sm text-gray-600 mt-1">
              Isi data user dengan lengkap dan benar
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Contoh: John Doe"
                  disabled={isPending}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-black"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="user@example.com"
                  disabled={isPending}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-black"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Email akan digunakan untuk login ke sistem
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Role / Jabatan <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;

                  return (
                    <div
                      key={role.value}
                      onClick={() => !isPending && setSelectedRole(role.value)}
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
                        checked={isSelected}
                        onChange={() => setSelectedRole(role.value)}
                        required
                        disabled={isPending}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div
                          className={`
                          p-2 rounded-lg transition-colors
                          ${
                            isSelected
                              ? role.color.selectedIconBg
                              : role.color.iconBg
                          }
                        `}
                        >
                          <Icon
                            className={`
                            w-5 h-5 transition-colors
                            ${
                              isSelected
                                ? role.color.selectedIconColor
                                : role.color.iconColor
                            }
                          `}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">
                              {role.label}
                            </p>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    disabled={isPending}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    minLength={6}
                    placeholder="Ketik ulang password"
                    disabled={isPending}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-medium mb-2">
                Persyaratan Password:
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                  Minimal 6 karakter
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                  Harus sama dengan konfirmasi password
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending || !selectedRole}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Buat User
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
