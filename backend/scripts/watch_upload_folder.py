"""
Script giám sát thư mục `backend/upload_drop` để tự động gán ảnh vào sách.

Hoạt động:
 - Kiểm tra file ảnh trong folder `upload_drop`
 - Lấy `document_id` theo thứ tự:
    1) filename có bắt đầu bằng object id (24 hex)
    2) mapping.csv trong folder (format: filename,document_id)
    3) tìm document qua API `/api/v1/documents?keyword=...` lấy kết quả đầu tiên
 - Gửi POST tới `/api/v1/documents/bulk/upload-images` với payload cho mỗi ảnh
 - Di chuyển file đã xử lý vào `processed/` hoặc `failed/`

Cấu hình qua .env:
  API_BASE_URL (default http://localhost:8000)
  WATCH_USERNAME, WATCH_PASSWORD để lấy token (tài khoản librarian/admin)

Chạy:
  cd backend
  python scripts/watch_upload_folder.py

"""

import os
import sys
import time
import re
import base64
import shutil
import unicodedata
import difflib
import asyncio
from pathlib import Path
from typing import Dict, Optional

import httpx
from dotenv import load_dotenv

# Add repo root to path if needed
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

load_dotenv(dotenv_path=ROOT / ".env")

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
API_BULK_ENDPOINT = f"{API_BASE_URL}/api/v1/documents/bulk/upload-images"
AUTH_ENDPOINT = f"{API_BASE_URL}/api/v1/auth/login"

WATCH_FOLDER = Path(__file__).resolve().parent.parent / "upload_drop"
PROCESSED_FOLDER = WATCH_FOLDER / "processed"
FAILED_FOLDER = WATCH_FOLDER / "failed"
MAPPING_CSV = WATCH_FOLDER / "mapping.csv"

POLL_INTERVAL = int(os.getenv("WATCH_POLL_INTERVAL", "5"))  # seconds

# Ensure folders exist
for p in (WATCH_FOLDER, PROCESSED_FOLDER, FAILED_FOLDER):
    p.mkdir(parents=True, exist_ok=True)


async def get_token(username: str, password: str) -> Optional[str]:
    async with httpx.AsyncClient() as client:
        try:
            print(f"Auth endpoint: {AUTH_ENDPOINT}")
            print(f"Auth username: {username}")
            r = await client.post(
                AUTH_ENDPOINT,
                data={"username": username, "password": password},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10,
            )
            print(f"Auth status: {r.status_code}")
            print(f"Auth response: {r.text}")
            if r.status_code == 200:
                data = r.json()
                return data.get("access_token")
            else:
                print("Auth failed:", r.text)
        except Exception as e:
            print("Auth error:", repr(e))
    return None


def load_mapping() -> Dict[str, str]:
    mapping = {}
    if MAPPING_CSV.exists():
        try:
            with open(MAPPING_CSV, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"): continue
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 2:
                        mapping[parts[0]] = parts[1]
        except Exception as e:
            print("Error reading mapping.csv:", e)
    return mapping


def filename_is_objectid(name: str) -> bool:
    # check 24 hex chars at start
    stem = Path(name).stem
    return len(stem) >= 24 and all(c in '0123456789abcdef' for c in stem[:24].lower())


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized.lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, a, b).ratio()


async def find_document_by_title(client: httpx.AsyncClient, title: str) -> Optional[str]:
    if not title:
        return None

    try:
        r = await client.get(
            f"{API_BASE_URL}/api/v1/documents",
            params={"keyword": title, "page": 1, "page_size": 20}
        )
        if r.status_code == 200:
            data = r.json()
            items = data.get("items") or []
            if not items:
                return None

            normalized_title = normalize_text(title)
            exact_matches = [item for item in items if normalize_text(item.get("title", "")) == normalized_title]
            if exact_matches:
                return exact_matches[0].get("id")

            substring_matches = [item for item in items if normalized_title in normalize_text(item.get("title", "")) or normalize_text(item.get("title", "")) in normalized_title]
            if substring_matches:
                return substring_matches[0].get("id")

            best_item = max(items, key=lambda item: similarity(normalize_text(item.get("title", "")), normalized_title))
            best_score = similarity(normalize_text(best_item.get("title", "")), normalized_title)
            if best_score >= 0.60:
                print(f"   ⚡ Best fuzzy match: {best_item.get('title')} (score={best_score:.2f})")
                return best_item.get("id")
    except Exception as e:
        print("Search error:", e)
    return None


def image_to_datauri(path: Path) -> str:
    data = base64.b64encode(path.read_bytes()).decode()
    ext = path.suffix.lower()
    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(ext, "image/jpeg")
    return f"data:{mime};base64,{data}"


async def process_file(client: httpx.AsyncClient, token: str, mapping: Dict[str, str], filepath: Path):
    filename = filepath.name
    print(f"Processing {filename}")

    # Determine document id
    doc_id = None
    if filename_is_objectid(filename):
        doc_id = Path(filename).stem[:24]
        print(f" - Found object id in filename: {doc_id}")
    elif filename in mapping:
        doc_id = mapping[filename]
        print(f" - Found in mapping.csv: {doc_id}")
    else:
        # try name without extension
        stem = Path(filename).stem
        if stem in mapping:
            doc_id = mapping[stem]
            print(f" - Found in mapping.csv by stem: {doc_id}")
        else:
            # try search by title
            found = await find_document_by_title(client, stem)
            if found:
                doc_id = found
                print(f" - Found by search: {doc_id}")

    if not doc_id:
        print(f" - Document id not found for {filename}")
        return False, "document_not_found"

    # prepare payload
    try:
        datauri = image_to_datauri(filepath)
        payload = [{"document_id": doc_id, "cover_image": datauri}]
        headers = {"Authorization": f"Bearer {token}"}
        r = await client.post(API_BULK_ENDPOINT, json=payload, headers=headers, timeout=60)
        if r.status_code == 200:
            print(f" - Uploaded: {filename} -> {doc_id}")
            return True, None
        else:
            print(f" - Upload failed: {r.status_code} {r.text}")
            return False, f"upload_failed:{r.status_code}"
    except Exception as e:
        print(" - Exception during upload:", e)
        return False, str(e)


async def watch_loop():
    username = os.getenv("WATCH_USERNAME") or os.getenv("TEST_USERNAME")
    password = os.getenv("WATCH_PASSWORD") or os.getenv("TEST_PASSWORD")
    if not username or not password:
        print("WATCH_USERNAME/WATCH_PASSWORD (or TEST_USERNAME/TEST_PASSWORD) not set in .env")
        return

    token = await get_token(username, password)
    if not token:
        print("Failed to get token; exiting")
        return

    async with httpx.AsyncClient() as client:
        while True:
            mapping = load_mapping()
            files = [p for p in WATCH_FOLDER.iterdir() if p.is_file() and p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp', '.gif')]
            if files:
                print(f"Found {len(files)} file(s) to process")
            for f in files:
                ok, err = await process_file(client, token, mapping, f)
                try:
                    if ok:
                        shutil.move(str(f), str(PROCESSED_FOLDER / f.name))
                    else:
                        # move to failed
                        dest = FAILED_FOLDER / f.name
                        shutil.move(str(f), str(dest))
                except Exception as e:
                    print("Error moving file:", e)
            await asyncio.sleep(POLL_INTERVAL)


if __name__ == '__main__':
    try:
        asyncio.run(watch_loop())
    except KeyboardInterrupt:
        print("Watcher stopped by user")
