"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  session: {
    userId: string;
    name: string;
    email: string;
    role: "SECURITY" | "CHECKER" | "ADMIN";
  };
}

export default function DashboardLayout({
  children,
  session,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={session.role} userName={session.name} />
      <main className="flex-1 overflow-y-auto p-5">
        <div className="lg:hidden h-16" />
        {children}
      </main>
    </div>
  );
}
