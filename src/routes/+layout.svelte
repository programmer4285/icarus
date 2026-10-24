<script lang="ts">
  import "../app.css";
  import favicon from "#lib/assets/favicon.svg";
  import { page } from "$app/state";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();

  const links = [
    { href: "/", label: "Home" },
    { href: "/jobs", label: "Jobs" },
    { href: "/files", label: "Files" },
  ];
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header>
  <nav>
    <span class="name">Icarus</span>
    {#if page.url.pathname !== "/login"}
      {#each links as link (link.href)}
        {@const isChild = link.href !== "/" && page.url.pathname.startsWith(`${link.href}/`)}
        {@const isCurrent = page.url.pathname === link.href || isChild}
        <a href={link.href} aria-current={isCurrent ? "page" : undefined}>
          {link.label}
        </a>
      {/each}
      <form method="POST" action="/logout">
        <button type="submit">Logout</button>
      </form>
    {/if}
  </nav>
</header>

<main>
  {@render children()}
</main>

<style>
  header {
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  nav,
  main {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: var(--space-3);
  }

  nav {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .name {
    font-weight: 700;
  }

  nav a {
    color: var(--color-muted);
    text-decoration: none;
  }

  nav a:hover,
  nav a[aria-current="page"] {
    color: var(--color-text);
  }

  nav a[aria-current="page"] {
    font-weight: 600;
  }

  nav form {
    margin-left: auto;
  }

  nav button {
    font: inherit;
    padding: 0;
    border: none;
    background: none;
    color: var(--color-muted);
    cursor: pointer;
  }

  nav button:hover {
    color: var(--color-text);
  }

  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: var(--space-5);
  }
</style>
