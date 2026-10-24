import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { delay } from "es-toolkit";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const FAILED_LOGIN_DELAY_MS = 500;

export const SESSION_COOKIE_NAME = "session";

export type Sessions = Map<string, number>;

export type Credentials = {
  username: string;
  password: string;
};

// secure must be false when running on LAN over http
export function sessionCookieOpts(secure: boolean) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: SESSION_DURATION_MS / 1000,
  } as const;
}

export async function login(
  sessions: Sessions,
  submitted: Credentials,
  admin: Credentials,
): Promise<string | null> {
  const sha256 = (value: string) => createHash("sha256").update(value).digest();

  const usernameMatches = timingSafeEqual(sha256(submitted.username), sha256(admin.username));
  const passwordMatches = timingSafeEqual(sha256(submitted.password), sha256(admin.password));

  if (!usernameMatches || !passwordMatches) {
    // small delay to slow down password guessing attempts
    await delay(FAILED_LOGIN_DELAY_MS);
    return null;
  }

  const token = randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_DURATION_MS);

  return token;
}

export function isValidSession(sessions: Sessions, token: string | undefined): boolean {
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

export function logout(sessions: Sessions, token: string | undefined): void {
  if (token) {
    sessions.delete(token);
  }
}
