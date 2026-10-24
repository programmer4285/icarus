import { redirect } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";
import { isValidSession, SESSION_COOKIE_NAME } from "#lib/server/auth.ts";

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === "/login") {
    return resolve(event);
  }

  const token = event.cookies.get(SESSION_COOKIE_NAME);
  if (!isValidSession(token)) {
    const next = event.url.pathname + event.url.search;
    redirect(303, `/login?next=${encodeURIComponent(next)}`);
  }

  return resolve(event);
};
