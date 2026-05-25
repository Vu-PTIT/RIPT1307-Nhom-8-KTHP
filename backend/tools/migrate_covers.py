import asyncio
import os
import mimetypes
import re
import unicodedata
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorGridFSBucket

# Import odmantic engine and Document model
import sys
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.session import engine
from app.models.document import Document


EXTS = [".jpg", ".jpeg", ".webp", ".png"]

TITLE_TO_COVER = {
    "A Brief History of Time": "/covers/brief-history.jpg",
    "Lịch Sử Hội HọA": "/covers/lich-su-hoi-hoa.jpg",
    "Lịch Sử Hội Họa": "/covers/lich-su-hoi-hoa.jpg",
    "Nguồn Gốc Các Loài": "/covers/darwin.jpg",
    "Nguồn gốc các loài": "/covers/darwin.jpg",
    "Tắt Đèn": "/covers/tat-den.jpg",
    "Hệ Quản Trị Cơ Sở Dữ Liệu (DBMS)": "/covers/dbms.jpg",
    "Hệ quản trị cơ sở dữ liệu (DBMS)": "/covers/dbms.jpg",
    "Chúa tể những chiếc nhẫn": "/covers/s-l960.webp",
    "Cấu trúc dữ liệu và Giải thuật": "/covers/cau-truc-du-lieu.jpg",
    "Hệ quản trị cơ sở dữ liệu MongoDB": "/covers/dbms.jpg",
    "Kinh tế học hài hước": "/covers/sieukinhte-haihuoc.jpg",
    "Lập trình Python cơ bản": "/covers/python-for-beginners.jpg",
    "Số đồ": "/covers/so-do.jpg",
    "Số đỏ": "/covers/so-do.jpg",
    "Lịch sử hội họa thế giới": "/covers/lich-su-hoi-hoa.jpg",
    "The Pragmatic Programmer": "/covers/pragmatic-programmer.jpg",
    "Tắt đèn": "/covers/tat-den.jpg",
}


def slugify(text: str) -> str:
    if not text:
        return ""
    s = unicodedata.normalize("NFD", text)
    s = s.encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()
    return re.sub(r"\s+", "-", s)


async def upload_file_and_update(bucket: AsyncIOMotorGridFSBucket, doc, file_path: Path):
    fname = file_path.name
    mime_type, _ = mimetypes.guess_type(str(file_path))
    with open(file_path, "rb") as fh:
        contents = fh.read()
    if not contents:
        return False, "empty file"
    file_id = await bucket.upload_from_stream(fname, contents, metadata={"contentType": mime_type})
    # update document
    doc.cover_image = str(file_id)
    await engine.save(doc)
    return True, str(file_id)


async def main():
    root = Path(__file__).resolve().parents[2]
    covers_dir = root / "base-web-umi" / "public" / "covers"
    if not covers_dir.exists():
        print(f"Covers folder not found: {covers_dir}")
        return

    db_name = engine.database_name
    db = engine.client[db_name]
    bucket = AsyncIOMotorGridFSBucket(db)

    docs = await engine.find(Document)
    total = len(docs)
    migrated = 0
    skipped = 0
    print(f"Found {total} documents. Scanning for cover images to migrate...")

    for doc in docs:
        current = doc.cover_image
        # skip if already an ObjectId-like string
        if isinstance(current, str) and re.fullmatch(r"[a-fA-F0-9]{24}", current):
            skipped += 1
            continue

        candidate_paths = []

        # Frontend's explicit title mapping is the most reliable source.
        mapped_cover = TITLE_TO_COVER.get(doc.title or "")
        if mapped_cover:
            candidate_paths.append(covers_dir / mapped_cover.replace("/covers/", ""))

        # If cover_image explicitly points to a covers path, try that
        if isinstance(current, str) and current.strip():
            c = current.strip()
            if c.startswith("/covers/"):
                candidate_paths.append(covers_dir / c.replace("/covers/", ""))
            elif c.startswith("covers/"):
                candidate_paths.append(covers_dir / c.replace("covers/", ""))
            else:
                # maybe filename only
                candidate_paths.append(covers_dir / c)

        # Also try slugified title
        slug = slugify(doc.title or "")
        if slug:
            for ext in EXTS:
                candidate_paths.append(covers_dir / f"{slug}{ext}")

        # try also some common exact filenames (title with spaces replaced)
        title_simple = re.sub(r"\s+", "-", (doc.title or "").lower()).strip()
        if title_simple and title_simple != slug:
            for ext in EXTS:
                candidate_paths.append(covers_dir / f"{title_simple}{ext}")

        # unique
        seen = set()
        candidate_paths = [p for p in candidate_paths if p not in seen and not seen.add(p)]

        found = None
        for p in candidate_paths:
            if p.exists() and p.is_file():
                found = p
                break

        if not found:
            print(f"No cover file found for document {doc.id} - '{doc.title}'")
            skipped += 1
            continue

        ok, info = await upload_file_and_update(bucket, doc, found)
        if ok:
            migrated += 1
            print(f"Migrated {doc.id} -> {info} from {found.name}")
        else:
            print(f"Failed to migrate {doc.id}: {info}")

    print(f"Done. Migrated: {migrated}, Skipped: {skipped}, Total: {total}")


if __name__ == "__main__":
    asyncio.run(main())
