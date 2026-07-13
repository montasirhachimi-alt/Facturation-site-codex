import { NextResponse, type NextRequest } from "next/server";
import { canViewModule, getModuleForPath } from "@/lib/rbac";
import type { AuthSession } from "@/lib/types";
import { getRouteAvailabilityDecision } from "@/platform/modules/module-route-availability";

const publicPaths = ["/", "/acces-refuse"];
const authCookieName = "hicotech-session";

function readSession(request: NextRequest): AuthSession | null {
  const raw = request.cookies.get(authCookieName)?.value;
  if (!raw) return null;
  try {
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as AuthSession;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const session = readSession(request);
  if (pathname === "/" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const routeAvailability = getRouteAvailabilityDecision(pathname);
  if (!routeAvailability.available && routeAvailability.redirectTo && routeAvailability.redirectTo !== pathname) {
    return NextResponse.redirect(new URL(routeAvailability.redirectTo, request.url));
  }

  const permissionModule = getModuleForPath(pathname);
  if (permissionModule && !canViewModule(session.role, permissionModule)) {
    return NextResponse.redirect(new URL("/acces-refuse", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
