# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "mutagen>=1.47",
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
        values = audio.get(k)
        if values:
            tags[k] = "; ".join(values)

    track = audio.get("tracknumber")
    if track:
        track_number, _, total_tracks = track[0].partition("/")
        tags["tracknumber"] = track_number
        if total_tracks:
            tags["totaltracks"] = total_tracks

    disc = audio.get("discnumber")
    if disc:
        disc_number, _, total_discs = disc[0].partition("/")
        tags["discnumber"] = disc_number
        if total_discs:
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
