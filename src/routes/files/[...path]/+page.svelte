<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const fields = [
    { key: "title", label: "Title" },
    { key: "artist", label: "Artist" },
    { key: "albumartist", label: "Album artist" },
    { key: "album", label: "Album" },
    { key: "date", label: "Date" },
    { key: "tracknumber", label: "Track number" },
    { key: "totaltracks", label: "Total tracks" },
    { key: "discnumber", label: "Disc number" },
    { key: "totaldiscs", label: "Total discs" },
  ] as const;
</script>

<svelte:head>
  <title>{data.tags.title || data.path} · Icarus</title>
</svelte:head>

<div class="editor">
  <a href="/files" class="back">← Files</a>
  <h1>{data.tags.title || "Untitled"}</h1>
  <p class="path">{data.path}</p>

  <dl>
    {#each fields as field (field.key)}
      <dt>{field.label}</dt>
      <dd>{data.tags[field.key] || "—"}</dd>
    {/each}
  </dl>
</div>

<style>
  .editor {
    width: 100%;
    max-width: 560px;
  }

  .back {
    display: inline-block;
    margin-bottom: var(--space-3);
  }

  h1 {
    margin-bottom: var(--space-1);
  }

  .path {
    margin: 0 0 var(--space-4);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    word-break: break-all;
  }

  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-2) var(--space-4);
    margin: 0;
  }

  dt {
    color: var(--color-muted);
  }

  dd {
    margin: 0;
  }
</style>
