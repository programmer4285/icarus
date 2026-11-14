<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
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
        </div>

        {#if job.error}
          <p class="error">{job.error}</p>
        {/if}

        {#if job.files.length > 0}
          <ul class="files">
            {#each job.files as file (file)}
              <li>{file}</li>
            {/each}
          </ul>
        {:else if job.status === "done"}
          <p class="muted">Already downloaded.</p>
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
