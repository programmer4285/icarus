import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { login, SESSION_COOKIE_NAME, sessionCookieOptions } from "#lib/server/auth.ts";
import type { Actions } from "./$types";

const loginFormSchema = z.object({
  username: z.string("Username is required").min(1, "Username is required"),
  password: z.string("Password is required").min(1, "Password is required"),
});

export const actions = {
  default: async ({ request, cookies, url }) => {
    const formData = await request.formData();
    const loginForm = Object.fromEntries(formData.entries());

    const parsed = loginFormSchema.safeParse(loginForm);
    if (!parsed.success) {
      // username could be type File
      const username = typeof loginForm.username === "string" ? loginForm.username : "";

      // return the first error to the user. a future enhancement could
      // return all the errors
      return fail(400, { username, error: parsed.error.issues[0].message });
    }

    const { username, password } = parsed.data;

    const token = await login(username, password);
    if (!token) {
      return fail(400, { username, error: "Invalid username or password" });
    }

    cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

    // NOTE: if next already contains an origin, url.origin does not override it
    const nextURL = new URL(url.searchParams.get("next") ?? "/", url.origin);

    if (nextURL.origin !== url.origin) {
      redirect(303, "/");
    }

    redirect(303, nextURL.pathname + nextURL.search);
  },
} satisfies Actions;
