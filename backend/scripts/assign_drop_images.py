"""
Assign images from backend/upload_drop directly to documents in MongoDB.

Usage:
  cd backend
  py -3 scripts/assign_drop_images.py

Behavior:
  - loads images in upload_drop/ with extensions jpg/jpeg/png/webp/gif
  - tries to resolve document by:
      1) filename starts with a 24-char ObjectId
      2) mapping.csv file in upload_drop mapping filename -> document_id
      3) exact or substring search by title
  - updates document.cover_image with base64 data URI
  - moves processed files to upload_drop/processed or upload_drop/failed
"""

import os
import re
import sys
import base64
import shutil
import unicodedata
import difflib
from pathlib import Path
from typing import Dict, Optional

import asyncio
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.core.config import settings
from app.models.document import Document
from odmantic import AIOEngine, ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

UPLOAD_DIR = ROOT / "upload_drop"
PROCESSED_DIR = UPLOAD_DIR / "processed"
FAILED_DIR = UPLOAD_DIR / "failed"
MAPPING_FILE = UPLOAD_DIR / "mapping.csv"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

load_dotenv(dotenv_path=ROOT / ".env")

for d in (UPLOAD_DIR, PROCESSED_DIR, FAILED_DIR):
    d.mkdir(parents=True, exist_ok=True)


def is_object_id(value: str) -> bool:
    return bool(re.fullmatch(r"[0-9a-fA-F]{24}", value))


def load_mapping() -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    if MAPPING_FILE.exists():
        with open(MAPPING_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = [p.strip() for p in line.split(",", 1)]
                if len(parts) == 2:
                    mapping[parts[0]] = parts[1]
    return mapping


async def find_document_by_id(engine: AIOEngine, doc_id: str) -> Optional[Document]:
    if not doc_id:
        return None
    try:
        return await engine.find_one(Document, Document.id == ObjectId(doc_id))
    except Exception:
        return await engine.find_one(Document, Document.id == doc_id)


def image_to_data_uri(path: Path) -> str:
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


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized.lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


async def find_document_by_title(engine: AIOEngine, title: str) -> Optional[Document]:
    if not title:
        return None

    title = title.strip()
    # Try exact match first
    doc = await engine.find_one(Document, Document.title == title)
    if doc:
        return doc

    # Try case-insensitive regex match
    collection = engine.get_collection(Document)
    regex = re.compile(re.escape(title), re.IGNORECASE)
    raw = await collection.find_one({"title": {"$regex": regex}})
    if raw:
        return engine.database_to_model(Document, raw)

    normalized_title = normalize_text(title)
    if not normalized_title:
        return None

    best_match = None
    best_score = 0.0
    substring_candidates = []

    all_docs = await engine.find(Document)
    for item in all_docs:
        doc_title = item.title or ""
        normalized_doc_title = normalize_text(doc_title)
        if normalized_doc_title == normalized_title:
            return item
        if normalized_title in normalized_doc_title or normalized_doc_title in normalized_title:
            substring_candidates.append(item)
        else:
            score = difflib.SequenceMatcher(None, normalized_title, normalized_doc_title).ratio()
            if score > best_score:
                best_score = score
                best_match = item

    if substring_candidates:
        return substring_candidates[0]

    if best_match and best_score >= 0.60:
        print(f"   ⚡ Close match by title: {best_match.title} (score={best_score:.2f})")
        return best_match

    return None


async def process_image(engine: AIOEngine, mapping: Dict[str, str], path: Path) -> bool:
    stem = path.stem
    doc: Optional[Document] = None
    doc_id = None

    if is_object_id(stem[:24]):
        doc_id = stem[:24]
        doc = await find_document_by_id(engine, doc_id)
        print(f"Using object id from filename for {path.name}: {doc_id}")
    if not doc:
        if path.name in mapping:
            doc_id = mapping[path.name]
            doc = await find_document_by_id(engine, doc_id)
            print(f"Found mapping for {path.name}: {doc_id}")
    if not doc and stem in mapping:
        doc_id = mapping[stem]
        doc = await find_document_by_id(engine, doc_id)
        print(f"Found mapping by stem for {path.name}: {doc_id}")
    if not doc:
        doc = await find_document_by_title(engine, stem)
        if doc:
            doc_id = str(doc.id)
            print(f"Found document by title for {path.name}: {doc_id} ({doc.title})")

    if not doc:
        print(f"Could not resolve document for {path.name}")
        return False

    doc.cover_image = image_to_data_uri(path)
    await engine.save(doc)
    print(f"Updated cover_image for {path.name} -> {doc.title} ({doc_id})")
    return True


async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    engine = AIOEngine(client=client, database=settings.DATABASE_NAME)

    mapping = load_mapping()
    files = [p for p in UPLOAD_DIR.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS]

    if not files:
        print("No image files found in upload_drop.")
        return

    success = 0
    failed = 0
    for path in files:
        try:
            ok = await process_image(engine, mapping, path)
            target_dir = PROCESSED_DIR if ok else FAILED_DIR
            shutil.move(str(path), str(target_dir / path.name))
            if ok:
                success += 1
            else:
                failed += 1
        except Exception as ex:
            print(f"Error processing {path.name}: {ex}")
            failed += 1
            shutil.move(str(path), str(FAILED_DIR / path.name))

    print(f"Done. Success={success}, Failed={failed}")


if __name__ == '__main__':
    asyncio.run(main())
