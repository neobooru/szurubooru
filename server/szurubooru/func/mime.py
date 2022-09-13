import mimetypes
import re
import magic
from typing import Optional


def get_mime_type(content: bytes) -> str:
    # return filetype.guess_mime(content) or "application/octet-stream"
    return magic.from_buffer(content, True)


def get_extension(mime_type: str) -> Optional[str]:
    # We use our own extension map because python's `mimetypes.guess_extension` doesn't support .avif (among others).
    extension_map = {
        "application/x-shockwave-flash": "swf",
        "image/gif": "gif",
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/bmp": "bmp",
        "image/avif": "avif",
        "image/heif": "heif",
        "image/heic": "heic",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "application/octet-stream": "dat",
    }
    return extension_map.get((mime_type or "").strip().lower(), None)


def is_flash(mime_type: str) -> bool:
    return mime_type.lower() == "application/x-shockwave-flash"


def is_video(mime_type: str) -> bool:
    return mime_type.lower().startswith("video/")


def is_image(mime_type: str) -> bool:
    return mime_type.lower().startswith("image/")


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
