<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();
</script>

<svelte:head>
  <title>{data.tags.title || data.path} · Icarus</title>
</svelte:head>

<div class="editor">
  <a href="/files" class="back">← Files</a>
  <h1>{data.tags.title || "Untitled"}</h1>
  <p class="path">{data.path}</p>

  <form
    method="POST"
    use:enhance
  >
      <label>
        <span>Title</span>
        <input name="title" value={data.tags.title} required />
      </label>
      <label>
        <span>Artist</span>
        <input name="artist" value={data.tags.artist} required />
      </label>
      <label>
        <span>Album Artist</span>
        <input name="albumArtist" value={data.tags.albumArtist} required />
      </label>
      <label>
        <span>Album</span>
        <input name="album" value={data.tags.album} required />
      </label>
      <label>
        <span>Date</span>
        <input name="date" value={data.tags.date} required />
      </label>

    <div class="row">
      <span>Track</span>
      <div class="pair">
        <input name="trackNumber" type="number" required min="1" max="100" aria-label="Track Number" value={data.tags.trackNumber} />
        <span class="of">of</span>
        <input name="totalTracks" type="number" required min="1" max="100" aria-label="Total Tracks" value={data.tags.totalTracks} />
      </div>
    </div>

    <div class="row">
      <span>Disc</span>
      <div class="pair">
        <input name="discNumber" type="number" required min="1" max="100" aria-label="Disc Number" value={data.tags.discNumber} />
        <span class="of">of</span>
        <input name="totalDiscs" type="number" required min="1" max="100" aria-label="Total Discs" value={data.tags.totalDiscs} />
      </div>
    </div>

    {#if form?.error}
      <p class="message error" role="alert">{form.error}</p>
    {:else if page.url.searchParams.get("saved") === "true"}
      <p class="message saved" role="status">Tags updated!</p>
    {/if}

    <button type="submit">Save</button>
  </form>
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

  form {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-3) var(--space-4);
    align-items: center;
  }

  label,
  .row {
    display: contents;
  }

  label > span,
  .row > span {
    color: var(--color-muted);
  }

  .pair {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .pair input {
    width: 6rem;
  }

  .of {
    color: var(--color-muted);
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

  .message,
  button {
    grid-column: 1 / -1;
    margin: 0;
  }

  .error {
    color: var(--color-error);
  }

  .saved {
    color: var(--color-success);
  }

  button {
    justify-self: start;
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
</style>
