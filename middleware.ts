import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths that do not require authentication
  const publicPaths = ["/login", "/api/auth/login"];
  if (publicPaths.some(p => pathname.startsWith(p)) || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Check if token exists in cookies
  const sessionCookie = request.cookies.get("comic-display-session");

  if (!sessionCookie || !sessionCookie.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)"],
};
