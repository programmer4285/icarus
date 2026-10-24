import { redirect } from "@sveltejs/kit";
import { logout, SESSION_COOKIE_NAME, sessionCookieOptions } from "#lib/server/auth.ts";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = ({ cookies }) => {
  logout(cookies.get(SESSION_COOKIE_NAME));
  cookies.delete(SESSION_COOKIE_NAME, sessionCookieOptions);
  redirect(303, "/login");
};
