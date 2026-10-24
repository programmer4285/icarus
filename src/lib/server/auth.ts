import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { delay } from "es-toolkit";
import { ADMIN_PASSWORD, ADMIN_USERNAME, COOKIE_SECURE } from "$app/env/private";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const FAILED_LOGIN_DELAY_MS = 500;

export const SESSION_COOKIE_NAME = "session";

export const sessionCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  secure: COOKIE_SECURE,
  maxAge: SESSION_DURATION_MS / 1000,
} as const;

// maintain an in memory map of current sessions. this is sufficient
// for a LAN service with one admin user.
const sessions = new Map<string, number>();

export async function login(username: string, password: string): Promise<string | null> {
  const sha256 = (value: string) => createHash("sha256").update(value).digest();

  const usernameMatches = timingSafeEqual(sha256(username), sha256(ADMIN_USERNAME));
  const passwordMatches = timingSafeEqual(sha256(password), sha256(ADMIN_PASSWORD));

  if (!usernameMatches || !passwordMatches) {
    // small delay to slow down password guessing attempts
    await delay(FAILED_LOGIN_DELAY_MS);
    return null;
  }

  const token = randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_DURATION_MS);
  return token;
}

export function isValidSession(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const expiresAt = sessions.get(token);
  if (expiresAt === undefined) {
    return false;
  }

  if (expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }

  return true;
}

export function logout(token: string | undefined): void {
  if (token) {
    sessions.delete(token);
  }
}
