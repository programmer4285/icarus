import { redirect } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";
import { isValidSession, SESSION_COOKIE_NAME, type Sessions } from "#lib/server/auth.ts";
import type { Cancellers, Job } from "#lib/server/jobs.ts";

// maintain an in memory map of current sessions. this is sufficient
// for a LAN application with one admin user
const sessions: Sessions = new Map();

const jobs: Job[] = [];
const cancellers: Cancellers = new Map();

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.sessions = sessions;
  event.locals.jobs = jobs;
  event.locals.cancellers = cancellers;

  if (event.url.pathname === "/login" || event.url.pathname === "/logout") {
    return resolve(event);
  }

  const token = event.cookies.get(SESSION_COOKIE_NAME);
  if (!isValidSession(sessions, token)) {
    const next = event.url.pathname + event.url.search;
    redirect(303, `/login?next=${encodeURIComponent(next)}`);
  }

  return resolve(event);
};
