import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    if (session.role === "SECURITY") redirect("/security/dashboard");
    if (session.role === "CHECKER") redirect("/checker/dashboard");
    if (session.role === "ADMIN") redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Container Checker
          </h1>
          <p className="mt-3 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <LoginForm />

        <div className="rounded-md bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-3">
            Demo Accounts:
          </h3>
          <ul className="text-xs text-blue-800 space-y-1 font-mono">
            <li>🔐 Security: security@company.com</li>
            <li>✓ Checker: checker@company.com</li>
            <li>👨‍💼 Admin: admin@company.com</li>
            <li className="font-semibold text-blue-900 mt-2">
              Password: password123
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
