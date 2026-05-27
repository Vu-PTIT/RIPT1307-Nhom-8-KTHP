import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb+srv://vult:bjtORP5vftBTkzct@cluster0.ntqyoma.mongodb.net/?appName=Cluster0"
DATABASE_NAME = "web_ck2"

# ---- Targets from debug ----
ITEM_TO_FIX_ID  = "6a0e8b2ca4924def33c15112"   # copy 9780553380163-002, record 6a0e8b2c
SAME_DOC_ID     = "6a02e7d75ec41ed95be12ff2"    # A Brief History of Time

async def main():
    from bson import ObjectId
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    copies_col = db["document_copies"]
    docs_col   = db["documents"]
    items_col  = db["borrow_record_items"]

    # Find all copies NOT from the duplicate document
    all_copies = await copies_col.find({}).to_list(length=None)
    print(f"Total document copies in DB: {len(all_copies)}")
    print()

    other_copies = [c for c in all_copies if str(c["document"]) != SAME_DOC_ID]
    print(f"Copies from OTHER documents: {len(other_copies)}")
    for c in other_copies:
        doc = await docs_col.find_one({"_id": c["document"]})
        title = doc["title"] if doc else "?"
        print(f"  copy={c['copy_code']} | status={c['status']} | doc={title}")

    if not other_copies:
        print("ERROR: No other copies found!")
        client.close()
        return

    # Pick the first available copy that is NOT currently in use as another active item
    active_items = await items_col.find({"return_date": None}).to_list(length=None)
    active_copy_ids = {str(it["document_copy"]) for it in active_items}

    replacement = None
    for c in other_copies:
        if str(c["_id"]) not in active_copy_ids:
            replacement = c
            break

    if not replacement:
        # If all are active, pick any from a different doc
        replacement = other_copies[0]
        print("NOTE: All other copies are active. Picking anyway.")

    repl_doc = await docs_col.find_one({"_id": replacement["document"]})
    repl_title = repl_doc["title"] if repl_doc else "?"

    print()
    print(f"==> Will change item {ITEM_TO_FIX_ID}")
    print(f"    OLD: copy 9780553380163-002  (A Brief History of Time)")
    print(f"    NEW: copy {replacement['copy_code']}  ({repl_title})")
    print()

    confirm = input("Confirm? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Cancelled.")
        client.close()
        return

    result = await items_col.update_one(
        {"_id": ObjectId(ITEM_TO_FIX_ID)},
        {"$set": {"document_copy": replacement["_id"]}}
    )
    print(f"Updated: {result.modified_count} record(s)")
    print(f"Done! Item now points to '{replacement['copy_code']}' ({repl_title})")

    client.close()

asyncio.run(main())
