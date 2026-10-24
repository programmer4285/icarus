<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Files · Icarus</title>
</svelte:head>

<h1>Files</h1>

{#if data.files.length === 0}
  <p class="muted">No audio files found.</p>
{:else}
  <p class="muted">{data.files.length} {data.files.length === 1 ? "file" : "files"}</p>

  <table>
    <thead>
      <tr>
        <th>Path</th>
        <th class="number">Size</th>
        <th>Modified</th>
      </tr>
    </thead>
    <tbody>
      {#each data.files as file (file.path)}
        <tr>
          <td>
            <a href="/files/{file.path.split('/').map(encodeURIComponent).join('/')}">
              {file.path}
            </a>
          </td>
          <td class="number">{(file.size / 1024 / 1024).toFixed(1)} MB</td>
          <td>{new Date(file.modifiedAt).toLocaleString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .muted {
    margin: 0 0 var(--space-3);
    color: var(--color-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: var(--space-2);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }

  th {
    color: var(--color-muted);
    font-weight: 600;
  }

  .number {
    text-align: right;
    white-space: nowrap;
  }
</style>
