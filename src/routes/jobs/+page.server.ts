import { cancelJob } from "#lib/server/jobs.ts";
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
} satisfies Actions;
