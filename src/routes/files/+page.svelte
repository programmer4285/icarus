<script lang="ts">
  import type { PageProps } from "./$types";

  type SortColumn = "path" | "size" | "modified";

  let { data }: PageProps = $props();

  let filter = $state("");
  let sortCol = $state<SortColumn>("modified");
  let sortAsc = $state(false);

  const visibleFiles = $derived.by(() => {
    const query = filter.trim().toLowerCase();

    // exclude .m4a from the filter
    const matchingFiles = data.files.filter((file) => {
      const pathWithoutExtension = file.path.replace(/\.m4a$/i, "");
      return pathWithoutExtension.toLowerCase().includes(query);
    });

    return matchingFiles.toSorted((a, b) => {
      let comparison: number;

      switch (sortCol) {
        case "path":
          comparison = a.path.localeCompare(b.path);
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        default:
          comparison = a.modifiedAt - b.modifiedAt;
          break;
      }

      return sortAsc ? comparison : -comparison;
    });
  });

  function sortBy(column: SortColumn) {
    // if the same col is clicked twice, flip the sort direction
    if (column === sortCol) {
      sortAsc = !sortAsc;
      return;
    }

    sortCol = column;

    // default to ASC only for Path
    sortAsc = column === "path";
  }

  function ariaSort(column: SortColumn) {
    if (column !== sortCol) {
      return undefined;
    }

    return sortAsc ? "ascending" : "descending";
  }
</script>

<svelte:head>
  <title>Files · Icarus</title>
</svelte:head>

<h1>Files</h1>

{#if data.files.length === 0}
  <p class="muted">No audio files found.</p>
{:else}
  <div class="toolbar">
    <input type="search" placeholder="Filter by path" bind:value={filter} />
    <span class="muted">
      {#if visibleFiles.length === data.files.length}
        {data.files.length} {data.files.length === 1 ? "file" : "files"}
      {:else}
        {visibleFiles.length} of {data.files.length} files
      {/if}
    </span>
  </div>

  <table>
    <thead>
      <tr>
        <th aria-sort={ariaSort("path")}>
          <button type="button" onclick={() => sortBy("path")}>Path</button>
        </th>
        <th class="number" aria-sort={ariaSort("size")}>
          <button type="button" onclick={() => sortBy("size")}>Size</button>
        </th>
        <th aria-sort={ariaSort("modified")}>
          <button type="button" onclick={() => sortBy("modified")}>Modified</button>
        </th>
      </tr>
    </thead>
    <tbody>
      {#each visibleFiles as file (file.path)}
        <tr>
          <td>
            <a href="/files/{encodeURIComponent(file.path)}">
              {file.path}
            </a>
          </td>
          <td class="number">{(file.size / 1024 / 1024).toFixed(1)} MB</td>
          <td>{new Date(file.modifiedAt).toLocaleString()}</td>
        </tr>
      {:else}
        <tr>
          <td colspan="3" class="muted">No files match "{filter}".</td>
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

  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    margin-bottom: var(--space-3);
  }

  .toolbar .muted {
    margin: 0;
    white-space: nowrap;
  }

  input {
    flex: 1;
    font: inherit;
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-background);
    color: var(--color-text);
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

  th button {
    font: inherit;
    font-weight: 600;
    padding: 0;
    border: none;
    background: none;
    color: var(--color-muted);
    cursor: pointer;
  }

  th[aria-sort] button {
    color: var(--color-text);
  }

  th[aria-sort="ascending"] button::after {
    content: " ▲";
  }

  th[aria-sort="descending"] button::after {
    content: " ▼";
  }

  .number {
    text-align: right;
    white-space: nowrap;
  }
</style>
