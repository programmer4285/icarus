import type { Sessions } from "#lib/server/auth.ts";
import type { Job } from "#lib/server/jobs.ts";

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      sessions: Sessions;
      jobs: Job[];
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
