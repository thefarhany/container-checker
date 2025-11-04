"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  FileText,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Users,
  BarChart3,
} from "lucide-react";

interface SidebarProps {
  role: "SECURITY" | "CHECKER" | "ADMIN";
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  const menuItems = {
    SECURITY: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/security/dashboard",
      },
      {
        icon: ClipboardCheck,
        label: "Pemeriksaan Baru",
        href: "/security/inspection/new",
      },
      { icon: FileText, label: "Riwayat", href: "/security/history" },
    ],
    CHECKER: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/checker/dashboard" },
      // Kontainer Pending dihapus sesuai permintaan
      { icon: FileText, label: "Riwayat", href: "/checker/history" },
    ],
    ADMIN: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
      { icon: Package, label: "Semua Kontainer", href: "/admin/containers" },
      { icon: Users, label: "Manajemen User", href: "/admin/users" },
      { icon: BarChart3, label: "Laporan", href: "/admin/reports" },
    ],
  };

  const currentMenu = menuItems[role] || [];

  const getUserInitial = () => {
    if (!userName || userName.length === 0) return "U";
    return userName.charAt(0).toUpperCase();
  };

  const getRoleDisplay = () => {
    switch (role) {
      case "SECURITY":
        return "Petugas Keamanan";
      case "CHECKER":
        return "Checker";
      case "ADMIN":
        return "Administrator";
      default:
        return "User";
    }
  };

  const getRoleShort = () => {
    switch (role) {
      case "SECURITY":
        return "Security";
      case "CHECKER":
        return "Checker";
      case "ADMIN":
        return "Admin";
      default:
        return "User";
    }
  };

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          flex flex-col
          z-40
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-3 ${collapsed ? "hidden" : ""}`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">
                  Container Check
                </h1>
                <p className="text-xs text-gray-500">{getRoleShort()}</p>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <ChevronLeft
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
              {getUserInitial()}
            </div>
            <div className={`flex-1 min-w-0 ${collapsed ? "hidden" : ""}`}>
              <p className="font-semibold text-gray-900 truncate text-sm">
                {userName || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getRoleDisplay()}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {currentMenu.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                          : "text-gray-700 hover:bg-gray-50"
                      }
                      ${collapsed ? "justify-center" : ""}
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={collapsed ? "hidden" : ""}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <form action={logout}>
            <button
              type="submit"
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-red-600 hover:bg-red-50 transition-colors
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? "Logout" : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={collapsed ? "hidden" : ""}>Logout</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
