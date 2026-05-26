import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb+srv://vult:bjtORP5vftBTkzct@cluster0.ntqyoma.mongodb.net/?appName=Cluster0"
DATABASE_NAME = "web_ck2"

async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    items_col  = db["borrow_record_items"]
    copies_col = db["document_copies"]
    docs_col   = db["documents"]

    active_items = await items_col.find({"return_date": None}).to_list(length=None)
    print("Active BorrowRecordItems:", len(active_items))
    print()

    # Group by doc_id across ALL records (not per borrow_record)
    from collections import defaultdict
    doc_groups = defaultdict(list)

    for it in active_items:
        copy = await copies_col.find_one({"_id": it["document_copy"]})
        if copy:
            doc = await docs_col.find_one({"_id": copy["document"]})
            title = doc["title"] if doc else "?"
            doc_id = str(copy["document"])
            doc_groups[doc_id].append({
                "item_id": str(it["_id"]),
                "record_id": str(it["borrow_record"]),
                "copy_code": copy["copy_code"],
                "copy_id": str(copy["_id"]),
                "title": title,
            })
            print(f"  record={str(it['borrow_record'])[:8]}... | copy={copy['copy_code']} | title={title}")

    print()
    print("=== Documents borrowed more than once ===")
    for doc_id, entries in doc_groups.items():
        if len(entries) >= 2:
            print(f"  doc_id={doc_id} | title={entries[0]['title']} | count={len(entries)}")
            for e in entries:
                print(f"    - item={e['item_id']} | copy={e['copy_code']} | record={e['record_id'][:8]}...")

    client.close()

asyncio.run(main())
