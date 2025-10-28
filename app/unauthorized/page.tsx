import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <p className="text-lg text-gray-600 mb-6">
          Anda tidak memiliki akses ke halaman ini
        </p>
        <Link
          href="/login"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
