import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { MAX_CONCURRENT, MAX_JOBS, MUSIC_DIR } from "$app/env/private";
import { runDownload } from "#lib/server/downloads.ts";
import { addJob, parseURL, processQueue } from "#lib/server/jobs.ts";
import type { Actions } from "./$types";

const urlSchema = z.url("That doesn't look like a URL 🤨").transform((val) => new URL(val));

export const actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const rawURL = formData.get("url");
    const url = typeof rawURL === "string" ? rawURL : "";

    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      return fail(400, { url, error: parsed.error.issues[0].message });
    }

    const result = parseURL(parsed.data);
    if ("error" in result) {
      return fail(400, { url: parsed.data, error: result.error });
    }

    addJob(locals.jobs, result.url, MAX_JOBS);
    processQueue(locals.jobs, MAX_CONCURRENT, (job) => runDownload(job, MUSIC_DIR));

    return { submitted: true };
  },
} satisfies Actions;
