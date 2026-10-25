#!/usr/bin/env bash
set -euo pipefail

# if the script does not have exactly 2 args, print a usage message
if [ $# -ne 2 ]; then
  echo "usage: download.sh <music-dir> <url>" >&2
  exit 2
fi

music_dir="$1"
url="$2"

# include track number if available
output_template='%(track_number&{}. |)s%(title)s.%(ext)s'

# exec replaces bash with yt-dlp. this means no child process is created
# and makes it easier to cancel yt-dlp
exec yt-dlp \
  --embed-metadata \
  --embed-thumbnail \
  --extractor-args "youtube:player-client=android" \
  --extract-audio \
  --audio-format m4a \
  --audio-quality 0 \
  --paths "$music_dir" \
  --output "$output_template" \
  --no-playlist \
  --no-overwrites \
  --download-archive "$music_dir/.download-archive" \
  --newline \
  --progress \
  --progress-template "download:[progress]%(progress._percent_str)s" \
  --print after_move:filepath \
  "$url"
