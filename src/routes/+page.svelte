<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageProps } from "./$types";

  let { form }: PageProps = $props();
</script>

<svelte:head>
  <title>Home · Icarus</title>
</svelte:head>

<h1>Download</h1>

<form method="POST" use:enhance>
  <input
    name="url"
    inputmode="url"
    autocomplete="off"
    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    aria-label="YouTube link"
    value={form?.url ?? ""}
    required
  />
  <button type="submit">Submit</button>
</form>

{#if form?.error}
  <p class="message error" role="alert">{form.error}</p>
{:else if form?.submitted}
  <p class="message" role="status">
    Recognised a {form.submitted.kind}: <a href={form.submitted.url}>{form.submitted.url}</a>
  </p>
{/if}

<style>
  form {
    display: flex;
    gap: var(--space-2);
    width: 100%;
    max-width: 640px;
  }

  input,
  button {
    font: inherit;
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
  }

  input {
    flex: 1;
    min-width: 0;
    background: var(--color-background);
    color: var(--color-text);
  }

  button {
    padding-inline: var(--space-4);
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

  .message {
    margin: var(--space-3) 0 0;
    color: var(--color-muted);
  }

  .error {
    color: var(--color-error);
  }
</style>
