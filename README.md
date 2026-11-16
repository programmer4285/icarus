# icarus

## Docker Compose

Create a `.env` file next to `docker-compose.yml`:

```sh
ORIGIN=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# optional: run as your host user so downloads are owned by you (defaults to 1000)
PUID=1000
PGID=1000
```

`ORIGIN` must match the URL you open in the browser, e.g. `http://192.168.1.10:3000`. It's built into the image, so changing it means rebuilding. Use `id -u` and `id -g` to find your `PUID` and `PGID`.

Then start it. Downloads are saved to `./downloads`, and files moved to the library go to `./library/<Album Artist>/<Album>/`:

```zsh
mkdir -p downloads library
docker compose up -d --build
```

### Updating

yt-dlp, Bun and uv aren't pinned, but Docker caches the build, so a normal rebuild keeps the versions you already have. To get the latest ones, rebuild without the cache:

```zsh
docker compose build --pull --no-cache && docker compose up -d
```
