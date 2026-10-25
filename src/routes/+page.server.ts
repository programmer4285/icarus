import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { parseURL } from "#lib/server/jobs.ts";
import type { Actions } from "./$types";

const urlSchema = z.url("That doesn't look like a URL 🤨").transform((val) => new URL(val));

export const actions = {
  default: async ({ request }) => {
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

    return { submitted: result };
  },
} satisfies Actions;
