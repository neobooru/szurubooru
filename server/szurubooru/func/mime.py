import re
import filetype
from typing import Optional


def get_mime_type(content: bytes) -> str:
    return filetype.guess_mime(content) or "application/octet-stream"


def get_extension(mime_type: str) -> Optional[str]:
    ftyp = filetype.get_type(mime_type)
    if ftyp != None:
        return ftyp.extension


def is_flash(mime_type: str) -> bool:
    return mime_type.lower() == "application/x-shockwave-flash"


def is_video(mime_type: str) -> bool:
    return mime_type.lower() in [x.mime for x in filetype.video_matchers]


def is_image(mime_type: str) -> bool:
    return mime_type.lower() in [x.mime for x in filetype.image_matchers]


def is_animated_gif(content: bytes) -> bool:
    pattern = b"\x21\xF9\x04[\x00-\xFF]{4}\x00[\x2C\x21]"
    return (
        get_mime_type(content) == "image/gif"
        and len(re.findall(pattern, content)) > 1
    )


def is_heif(mime_type: str) -> bool:
    return mime_type.lower() in (
        "image/heif",
        "image/heic",
        "image/avif",
    )
