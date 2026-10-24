# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "mutagen>=1.47,<2",
# ]
# ///
import json
import sys

from mutagen.easymp4 import EasyMP4

TAG_KEYS = ["title", "artist", "albumartist", "album", "date"]


def read_tags(path):
    audio = EasyMP4(path)

    tags = {}
    for k in TAG_KEYS:
        tags[k] = "; ".join(audio.get(k, []))

    track_number, _, total_tracks = audio.get("tracknumber", [""])[0].partition("/")
    disc_number, _, total_discs = audio.get("discnumber", [""])[0].partition("/")

    tags["tracknumber"] = track_number
    tags["totaltracks"] = total_tracks
    tags["discnumber"] = disc_number
    tags["totaldiscs"] = total_discs

    return tags


if len(sys.argv) != 3 or sys.argv[1] != "read":
    print("usage: tags.py read <path>", file=sys.stderr)
    sys.exit(2)

path = sys.argv[2]

try:
    print(json.dumps(read_tags(path)))
except Exception as error:
    print(f"{type(error).__name__}: {error}", file=sys.stderr)
    sys.exit(1)
