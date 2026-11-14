<script lang="ts">
  import { enhance } from "$app/forms";
  import { refreshAll } from "$app/navigation";
  import type { PageProps } from "./$types";

  const RELOAD_INTERVAL_MS = 2000;

  let { data }: PageProps = $props();

  const hasActiveJobs = $derived(
    data.jobs.some((job) => job.status === "queued" || job.status === "running"),
  );

  $effect(() => {
    if (!hasActiveJobs) {
      return;
    }

    const interval = setInterval(() => refreshAll(), RELOAD_INTERVAL_MS);
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Jobs · Icarus</title>
</svelte:head>

<h1>Jobs</h1>

{#if data.jobs.length === 0}
  <p class="muted">No jobs yet. <a href="/">Start a download</a>.</p>
{:else}
  <ul class="jobs">
    {#each data.jobs as job (job.id)}
      <li class="job">
        <div class="header">
          <span class="status {job.status}">{job.status}</span>
          <a href={job.url} target="_blank" rel="noreferrer">{job.url}</a>
          <span class="muted">{new Date(job.createdAt).toLocaleString()}</span>
          {#if job.status === "queued" || job.status === "running"}
            <form method="POST" action="?/cancel" use:enhance>
              <input type="hidden" name="id" value={job.id} />
              <button type="submit">Cancel</button>
            </form>
          {/if}
        </div>

        {#if job.status === "running"}
          <div class="progress">
            <progress max="100" value={job.progress} aria-label="Current video progress"
            ></progress>
            <span class="muted">{job.progress.toFixed(1)}%</span>
          </div>
        {/if}

        {#if job.error}
          <p class="error">{job.error}</p>
        {/if}

        {#if job.files.length > 0}
          <ul class="files">
            {#each job.files as file (file)}
              <li>{file}</li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .muted {
    margin: 0;
    color: var(--color-muted);
  }

  .jobs {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .job {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
  }

  .header a {
    flex: 1;
    overflow-wrap: anywhere;
  }

  button {
    font: inherit;
    font-size: 0.875rem;
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-background);
    color: var(--color-text);
    cursor: pointer;
  }

  button:hover {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .status {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
    color: var(--color-muted);
  }

  .status.running {
    color: var(--color-button-hover);
  }

  .status.done {
    color: var(--color-success);
  }

  .status.failed {
    color: var(--color-error);
  }

  .progress {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  progress {
    flex: 1;
    height: 0.5rem;
    accent-color: var(--color-button);
  }

  .progress .muted {
    min-width: 3.5rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .error {
    margin: 0;
    color: var(--color-error);
    font-family: var(--font-mono);
    font-size: 0.875rem;
  }

  .files {
    margin: 0;
    padding-left: var(--space-4);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    overflow-wrap: anywhere;
  }
</style>
