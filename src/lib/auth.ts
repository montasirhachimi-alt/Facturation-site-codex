import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import type { AppUser, AuthSession } from "@/lib/types";

export const authCookieName = "hicotech-session";

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(`hicotech:${password}`).digest("hex");
}

export function verifyPassword(password: string, hash: string) {
  return hashPassword(password) === hash;
}

export function sanitizeUser(user: AppUser): AuthSession {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId
  };
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(authCookieName)?.value;
  if (!raw) return null;

  try {
    const session = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as AuthSession;
    return session.userId && session.email && session.role ? session : null;
  } catch {
    return null;
  }
}

export async function setSession(user: AppUser) {
  const cookieStore = await cookies();
  cookieStore.set(authCookieName, Buffer.from(JSON.stringify(sanitizeUser(user))).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
}
