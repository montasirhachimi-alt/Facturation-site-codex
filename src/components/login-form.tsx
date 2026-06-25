"use client";

import { FormEvent, useState } from "react";
import { demoUsers } from "@/lib/demo-data";
import type { AppUser, AuthSession } from "@/lib/types";

const usersStorageKey = "hicotech-users";
const authCookieName = "hicotech-session";

export function LoginForm() {
  const [email, setEmail] = useState("admin@hicotech.ma");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.toLowerCase().trim();
    const users = getLoginUsers();
    const user = users.find((item) => item.email.toLowerCase() === normalizedEmail && item.status === "active");
    const passwordHash = await hashPasswordClient(password);

    if (!user || user.passwordHash !== passwordHash) {
      setError(true);
      return;
    }

    setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId
    });
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={login} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-hicotech-red">
          Email ou mot de passe incorrect.
        </p>
      )}
      <label className="block">
        <span className="text-sm font-semibold text-hicotech-navy">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4"
          type="email"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-hicotech-navy">Mot de passe</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4"
          placeholder="Mot de passe"
          type="password"
        />
      </label>
      <button
        type="submit"
        className="flex w-full items-center justify-center rounded-lg bg-hicotech-blue px-4 py-3 font-display text-sm font-bold text-white shadow-soft transition hover:bg-blue-700"
      >
        Ouvrir le tableau de bord
      </button>
    </form>
  );
}

function getLoginUsers() {
  const storedUsers = readStoredUsers();
  if (storedUsers.length === 0) return demoUsers;

  const byId = new Map<string, AppUser>();
  demoUsers.forEach((user) => byId.set(user.id, user));
  storedUsers.forEach((user) => byId.set(user.id, user));
  return Array.from(byId.values());
}

function readStoredUsers() {
  try {
    const raw = window.localStorage.getItem(usersStorageKey);
    return raw ? JSON.parse(raw) as AppUser[] : [];
  } catch {
    return [];
  }
}

async function hashPasswordClient(password: string) {
  const data = new TextEncoder().encode(`hicotech:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function setSessionCookie(session: AuthSession) {
  const value = base64UrlEncode(JSON.stringify(session));
  document.cookie = `${authCookieName}=${value}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
}

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

