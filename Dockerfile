FROM ghcr.io/astral-sh/uv:latest AS uv

# ref: https://bun.com/guides/ecosystem/docker
FROM oven/bun:1 AS build
WORKDIR /app

# install all dependencies required for build
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile --ignore-scripts

# copy all non-ignored project files into the image
COPY . .

# build the app
ARG ORIGIN
RUN test -n "$ORIGIN" || (echo "ORIGIN build arg is required, e.g. http://192.168.1.10:3000" >&2 && exit 1)
ENV NODE_ENV=production
RUN bun run build

FROM oven/bun:1-slim AS release
WORKDIR /app

# install dependencies for yt-dlp and delete apt's package index (it's large)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# use uv to install yt-dlp and setup scripts
COPY --from=uv /uv /uvx /usr/local/bin/
ENV UV_PYTHON_INSTALL_DIR=/opt/uv/python \
  UV_TOOL_DIR=/opt/uv/tools \
  UV_TOOL_BIN_DIR=/usr/local/bin \
  UV_CACHE_DIR=/opt/uv/cache

RUN uv tool install "yt-dlp[default]" --no-cache

COPY scripts ./scripts
RUN uv sync --script scripts/tags.py && chown -R bun:bun /opt/uv

# install runtime dependencies
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile --production --ignore-scripts

# copy the built app into final image
COPY --from=build /app/build ./build

# run the app
ENV NODE_ENV=production
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "build/index.js" ]
