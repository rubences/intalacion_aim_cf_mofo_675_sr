from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parent
TEXT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
}


def _safe_target(path_info: str) -> Path:
    clean_path = (path_info or "/").split("?", 1)[0]
    clean_path = clean_path.lstrip("/")
    target = ROOT / clean_path if clean_path else ROOT / "index.html"

    if not clean_path or clean_path.endswith("/"):
        target = ROOT / "index.html"

    try:
        resolved = target.resolve(strict=False)
    except OSError:
        return ROOT / "index.html"

    if ROOT not in resolved.parents and resolved != ROOT:
        return ROOT / "index.html"

    if resolved.exists() and resolved.is_file():
        return resolved

    return ROOT / "index.html"


def _content_type(file_path: Path) -> str:
    return TEXT_TYPES.get(file_path.suffix.lower(), "application/octet-stream")


def app(environ, start_response) -> Iterable[bytes]:
    file_path = _safe_target(environ.get("PATH_INFO", "/"))
    body = file_path.read_bytes()

    start_response(
        "200 OK",
        [
            ("Content-Type", _content_type(file_path)),
            ("Content-Length", str(len(body))),
            ("Cache-Control", "public, max-age=0, must-revalidate"),
        ],
    )
    return [body]