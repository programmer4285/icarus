import { fail } from "@sveltejs/kit";
import { MAX_CONCURRENT, MAX_JOBS, MUSIC_DIR } from "$app/env/private";
import { runDownload } from "#lib/server/downloads.ts";
import {
  addJob,
  cancelJob,
  clearFinishedJobs,
  processQueue,
  RETRIABLE_STATUSES,
  type Job,
} from "#lib/server/jobs.ts";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // jobs are ordered oldest to newest, we want to display
  // the reverse order on the page
  return { jobs: locals.jobs.toReversed() };
};

export const actions = {
  cancel: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get("id");

    if (typeof id === "string") {
      cancelJob(locals.jobs, locals.cancellers, id);
    }
  },

  retry: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get("id");

    const job = locals.jobs.find((job) => job.id === id);
    if (!job || !RETRIABLE_STATUSES.includes(job.status)) {
      return fail(400, { error: "Only failed or cancelled jobs can be retried" });
    }

    addJob(locals.jobs, job.url, MAX_JOBS);

    const runJob = (job: Job) => runDownload(job, MUSIC_DIR, locals.cancellers);

    processQueue(locals.jobs, MAX_CONCURRENT, runJob);
  },

  clear: async ({ locals }) => {
    clearFinishedJobs(locals.jobs);
  },
} satisfies Actions;
