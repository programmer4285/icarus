<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageProps } from "./$types";

  let { form }: PageProps = $props();
</script>

<svelte:head>
  <title>Login · Icarus</title>
</svelte:head>

<h1>Login</h1>

<form method="POST" use:enhance>
  <label>
    Username
    <input
      name="username"
      autocomplete="username"
      value={form?.username ?? ""}
      required
    />
  </label>

  <label>
    Password
    <input name="password" type="password" autocomplete="current-password" required />
  </label>

  {#if form?.error}
    <p class="error" role="alert">{form.error}</p>
  {/if}

  <button type="submit">Log in</button>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
    max-width: 320px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  input,
  button {
    font: inherit;
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
  }

  input {
    background: var(--color-background);
    color: var(--color-text);
  }

  button {
    background: var(--color-button);
    border-color: var(--color-button);
    color: var(--color-button-text);
    font-weight: 600;
    cursor: pointer;
  }

  button:hover {
    background: var(--color-button-hover);
    border-color: var(--color-button-hover);
  }

  .error {
    margin: 0;
    color: var(--color-error);
  }
</style>
