import { redirect } from "@sveltejs/kit";
import { COOKIE_SECURE } from "$app/env/private";
import { logout, SESSION_COOKIE_NAME, sessionCookieOpts } from "#lib/server/auth.ts";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = ({ cookies, locals }) => {
  logout(locals.sessions, cookies.get(SESSION_COOKIE_NAME));
  cookies.delete(SESSION_COOKIE_NAME, sessionCookieOpts(COOKIE_SECURE));
  redirect(303, "/login");
};
