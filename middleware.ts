import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isPublicPage = pathname === "/";

  if (!session && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isAuthPage) {
    try {
      const sessionData = JSON.parse(session.value);
      const role = sessionData.role;

      if (role === "SECURITY") {
        return NextResponse.redirect(
          new URL("/security/dashboard", request.url)
        );
      } else if (role === "CHECKER") {
        return NextResponse.redirect(
          new URL("/checker/dashboard", request.url)
        );
      } else if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    } catch {
      // Invalid session, continue to login
    }
  }

  // Role-based access control
  if (session) {
    try {
      const sessionData = JSON.parse(session.value);
      const role = sessionData.role;

      if (pathname.startsWith("/security") && role !== "SECURITY") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (pathname.startsWith("/checker") && role !== "CHECKER") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
