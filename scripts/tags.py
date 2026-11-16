# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "mutagen>=1.47",
# ]
# ///
import json
import sys

from mutagen.easymp4 import EasyMP4

# tracknumber is formatted as "1/11" where 1 is the track number and
# 11 is the total tracks. discnumber follows the same format
TAG_KEYS = [
    "title",
    "artist",
    "albumartist",
    "album",
    "date",
    "tracknumber",
    "discnumber",
]


def read_tags(path):
    audio = EasyMP4(path)

    tags = {}
    for k in TAG_KEYS:
        values = audio.get(k)
        if values:
            # one tag may have multiple values, they're stored in an array
            tags[k] = "; ".join(values)

    return tags


def write_tags(path, new_tags):
    audio = EasyMP4(path)

    # add tags object if it's not present
    if audio.tags is None:
        audio.add_tags()

    # if a tag value was provided, add it. otherwise do nothing
    for k in TAG_KEYS:
        val = new_tags.get(k)
        if val:
            audio.tags[k] = val

    audio.save()


if len(sys.argv) != 3 or sys.argv[1] not in ("read", "write"):
    print("usage: tags.py read|write <path>", file=sys.stderr)
    sys.exit(2)

mode, path = sys.argv[1], sys.argv[2]

try:
    if mode == "read":
        print(json.dumps(read_tags(path)))
    else:
        write_tags(path, json.load(sys.stdin))
except Exception as error:
    print(f"{type(error).__name__}: {error}", file=sys.stderr)
    sys.exit(1)
