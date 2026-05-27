"""
Export document IDs and titles to a CSV file to help map images to the correct books.

Usage:
  cd backend
  python scripts/export_document_titles.py

Output:
  backend/scripts/document_title_map.csv
"""

import csv
import sys
from pathlib import Path
import asyncio

from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.core.config import settings
from app.models.document import Document

load_dotenv(dotenv_path=ROOT / ".env")

OUTPUT_FILE = Path(__file__).resolve().parent / "document_title_map.csv"

async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    engine = AIOEngine(client=client, database=settings.DATABASE_NAME)

    documents = await engine.find(Document, sort=Document.title)
    if not documents:
        print("No documents found in the database.")
        return

    with OUTPUT_FILE.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["document_id", "title"])
        for doc in documents:
            writer.writerow([str(doc.id), doc.title or ""])

    print(f"Exported {len(documents)} documents to {OUTPUT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())
