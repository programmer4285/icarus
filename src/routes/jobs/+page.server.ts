import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // jobs are ordered oldest to newest, we want to display
  // the reverse order on the page
  return { jobs: locals.jobs.toReversed() };
};
