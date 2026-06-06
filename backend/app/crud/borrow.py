from __future__ import annotations
from datetime import datetime, date, timedelta
from typing import Optional, List, Any, Tuple
from odmantic import AIOEngine, ObjectId
from app.models.borrow import Wishlist, BorrowCartItem, BorrowRecord, BorrowRecordItem, RenewalRequest
from app.models.document import Document, DocumentCopy
from app.models.user import User
from app.crud.notification import create_notification, notify_librarians

# Wishlist
async def get_wishlists(engine: AIOEngine, user_id: str) -> List[dict[str, Any]]:
    collection = engine.get_collection(Wishlist)
    return await collection.find({"user": ObjectId(user_id)}).to_list(length=None)

async def add_to_wishlist(engine: AIOEngine, user_id: str, doc_id: str) -> dict[str, Any]:
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    doc = await engine.find_one(Document, Document.id == ObjectId(doc_id))
    if not user or not doc:
        raise ValueError("User or Document not found")
    
    collection = engine.get_collection(Wishlist)
    existing_raw = await collection.find_one({"user": ObjectId(user_id), "document": ObjectId(doc_id)})
    if existing_raw:
        return existing_raw
        
    db_obj = Wishlist(user=user, document=doc)
    await engine.save(db_obj)
    return {
        "_id": db_obj.id,
        "user": ObjectId(user_id),
        "document": ObjectId(doc_id),
        "added_at": db_obj.added_at,
    }

async def remove_from_wishlist(engine: AIOEngine, wishlist_id: str, user_id: str) -> bool:
    collection = engine.get_collection(Wishlist)
    result = await collection.delete_one({"_id": ObjectId(wishlist_id), "user": ObjectId(user_id)})
    return result.deleted_count > 0

# Borrow Cart
async def get_cart_items(engine: AIOEngine, user_id: str) -> List[dict[str, Any]]:
    collection = engine.get_collection(BorrowCartItem)
    return await collection.find({"user": ObjectId(user_id)}).to_list(length=None)

async def add_to_cart(engine: AIOEngine, user_id: str, doc_id: str) -> dict[str, Any]:
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    doc = await engine.find_one(Document, Document.id == ObjectId(doc_id))
    if not user or not doc:
        raise ValueError("User or Document not found")
        
    # Check if document has available copies
    if doc.available_copies <= 0:
        raise ValueError("No available copies for this document")
        
    collection = engine.get_collection(BorrowCartItem)
    existing_raw = await collection.find_one({"user": ObjectId(user_id), "document": ObjectId(doc_id)})
    if existing_raw:
        return existing_raw
        
    # Check max limit
    from app.crud.setting import get_setting
    max_books_setting = await get_setting(engine, "default_max_books")
    max_books = int(max_books_setting.setting_value) if max_books_setting else 5
    if user.max_books_allowed is not None:
        max_books = user.max_books_allowed

    current_borrowed = await count_current_borrowed(engine, user_id)
    current_in_cart = await collection.count_documents({"user": ObjectId(user_id)})

    if current_borrowed + current_in_cart >= max_books:
        raise ValueError(f"Giới hạn mượn của bạn là {max_books} cuốn (Đang mượn: {current_borrowed}, Trong giỏ: {current_in_cart}). Không thể thêm.")

    db_obj = BorrowCartItem(user=user, document=doc)
    await engine.save(db_obj)
    return {
        "_id": db_obj.id,
        "user": ObjectId(user_id),
        "document": ObjectId(doc_id),
        "added_at": db_obj.added_at,
    }

async def remove_from_cart(engine: AIOEngine, cart_item_id: str, user_id: str) -> bool:
    collection = engine.get_collection(BorrowCartItem)
    result = await collection.delete_one({"_id": ObjectId(cart_item_id), "user": ObjectId(user_id)})
    return result.deleted_count > 0

async def clear_cart(engine: AIOEngine, user_id: str):
    collection = engine.get_collection(BorrowCartItem)
    await collection.delete_many({"user": ObjectId(user_id)})


async def create_borrow_from_cart(
    engine: AIOEngine,
    user_id: str,
) -> BorrowRecord:
    """Create a borrow record using all items currently in the user's cart.

    - Selects one available copy per document in the cart.
    - Honors user limits (default or per-user override).
    - Clears the cart on success.
    """
    # Load user and cart items
    reader = await engine.find_one(User, User.id == ObjectId(user_id))
    if not reader:
        raise ValueError("Reader not found")

    # Get cart items using motor
    cart_collection = engine.get_collection(BorrowCartItem)
    cart_raw = await cart_collection.find({"user": ObjectId(user_id)}).to_list(length=None)
    if not cart_raw:
        raise ValueError("Borrow cart is empty")

    # Get limits
    from app.crud.setting import get_setting
    max_books_setting = await get_setting(engine, "default_max_books")
    max_days_setting = await get_setting(engine, "default_max_days")
    max_books = int(max_books_setting.setting_value) if max_books_setting else 5
    max_days = int(max_days_setting.setting_value) if max_days_setting else 14
    if reader.max_books_allowed is not None:
        max_books = reader.max_books_allowed
    if reader.max_days_allowed is not None:
        max_days = reader.max_days_allowed

    # Count current active borrowed items using motor
    borrow_collection = engine.get_collection(BorrowRecord)
    active_raw = await borrow_collection.find({"reader": ObjectId(user_id), "status": {"$in": ["borrowed", "pending"]}}).to_list(length=None)
    current_borrowed = 0
    item_collection = engine.get_collection(BorrowRecordItem)
    for rec in active_raw:
        rec_items_raw = await item_collection.find({"borrow_record": rec["_id"], "return_date": None}).to_list(length=None)
        current_borrowed += len(rec_items_raw)

    if current_borrowed + len(cart_raw) > max_books:
        raise ValueError(
            {
                "code": "borrow_limit_exceeded",
                "message": f"Bạn đang mượn {current_borrowed} cuốn, giới hạn là {max_books}.",
                "current_borrowed": current_borrowed,
                "cart_size": len(cart_raw),
                "max_books": max_books,
            }
        )

    # Find available copies for each cart item
    copies = []
    for cart_item in cart_raw:
        doc = await engine.find_one(Document, Document.id == cart_item["document"])
        if not doc:
            raise ValueError("Document not found in cart")
        copy_collection = engine.get_collection(DocumentCopy)
        copy_raw = await copy_collection.find_one({"document": ObjectId(doc.id), "status": "available"})
        if not copy_raw:
            raise ValueError(f"No available copies for document '{doc.title}'")
        copy = await engine.find_one(DocumentCopy, DocumentCopy.id == copy_raw["_id"])
        if not copy:
            raise ValueError(f"Unable to load copy for document '{doc.title}'")
        copies.append(copy)

    # Create borrow record; for self-checkout we set librarian = reader, status = pending
    record = BorrowRecord(
        reader=reader,
        librarian=reader,
        borrow_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=max_days),
        status="pending",
    )
    await engine.save(record)

    # Create items and update copy/document counts
    for copy in copies:
        item = BorrowRecordItem(borrow_record=record, document_copy=copy, due_date=record.due_date)
        await engine.save(item)
        copy.status = "reserved"
        await engine.save(copy)

        doc = await engine.find_one(Document, Document.id == copy.document.id)
        if doc:
            doc.available_copies = max(0, doc.available_copies - 1)
            await engine.save(doc)

    # Clear cart
    await cart_collection.delete_many({"user": ObjectId(user_id)})

    # Notify librarians
    short_id = str(record.id)[:8].upper()
    await notify_librarians(
        engine,
        title="Yêu cầu mượn sách mới",
        message=f"Độc giả {reader.username} vừa tạo yêu cầu mượn sách mới (phiếu #{ short_id }).",
        notif_type="new_borrow_request"
    )

    return record

async def confirm_borrow_handover(engine: AIOEngine, record_id: str, librarian_id: str) -> BorrowRecord:
    """Librarian confirms handover of reserved books. Record status becomes borrowed."""
    record = await engine.find_one(BorrowRecord, BorrowRecord.id == ObjectId(record_id))
    if not record or record.status != "pending":
        raise ValueError("Record not found or not in pending state")
        
    librarian = await engine.find_one(User, User.id == ObjectId(librarian_id))
    if librarian:
        record.librarian = librarian

    now = datetime.utcnow()
    # Recalculate max_days
    max_days = 14
    if record.reader.max_days_allowed is not None:
        max_days = record.reader.max_days_allowed
    
    record.status = "borrowed"
    record.borrow_date = now
    record.due_date = now + timedelta(days=max_days)
    await engine.save(record)
    
    # Update copies and items
    item_collection = engine.get_collection(BorrowRecordItem)
    items_raw = await item_collection.find({"borrow_record": record.id}).to_list(length=None)
    for raw in items_raw:
        item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == raw["_id"])
        if item:
            item.due_date = record.due_date
            await engine.save(item)
            
            copy = await engine.find_one(DocumentCopy, DocumentCopy.id == item.document_copy.id)
            if copy:
                copy.status = "borrowed"
                await engine.save(copy)
                
    # Notify user
    short_id = str(record.id)[:8].upper()
    await create_notification(
        engine,
        user_id=str(record.reader.id),
        title="Đã nhận sách",
        message=f"Phiếu mượn #{short_id} của bạn đã được thủ thư xác nhận giao sách. Hạn trả: {record.due_date.strftime('%d/%m/%Y')}.",
        notif_type="checkout"
    )
                
    return record

async def cancel_borrow_reservation(engine: AIOEngine, record_id: str) -> BorrowRecord:
    """Cancel a pending reservation. Copies return to available."""
    record = await engine.find_one(BorrowRecord, BorrowRecord.id == ObjectId(record_id))
    if not record or record.status != "pending":
        raise ValueError("Record not found or not in pending state")
        
    record.status = "cancelled"
    await engine.save(record)
    
    item_collection = engine.get_collection(BorrowRecordItem)
    items_raw = await item_collection.find({"borrow_record": record.id}).to_list(length=None)
    for raw in items_raw:
        item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == raw["_id"])
        if item:
            copy = await engine.find_one(DocumentCopy, DocumentCopy.id == item.document_copy.id)
            if copy:
                copy.status = "available"
                await engine.save(copy)
                
                doc = await engine.find_one(Document, Document.id == copy.document.id)
                if doc:
                    doc.available_copies += 1
                    await engine.save(doc)
                    
    return record

# Borrow Records
async def get_my_borrow_records(engine: AIOEngine, user_id: str, status: Optional[str] = None) -> List[BorrowRecord]:
    # Dùng odmantic engine.find thay vì raw Motor query để khớp với cách odmantic lưu Reference
    filters = [BorrowRecord.reader == ObjectId(user_id)]
    if status:
        filters.append(BorrowRecord.status == status)
    records = await engine.find(
        BorrowRecord,
        *filters,
        sort=BorrowRecord.borrow_date.desc()
    )
    return list(records)


async def count_current_borrowed(engine: AIOEngine, user_id: str) -> int:
    """Count active (not returned) borrowed items for a user."""
    borrow_collection = engine.get_collection(BorrowRecord)
    item_collection = engine.get_collection(BorrowRecordItem)

    # Find active borrow records for reader
    active_raw = await borrow_collection.find({"reader": ObjectId(user_id), "status": {"$in": ["borrowed", "pending"]}}).to_list(length=None)
    total = 0
    for rec in active_raw:
        cnt = await item_collection.count_documents({"borrow_record": rec["_id"], "return_date": None})
        total += cnt
    return total

async def get_borrow_record_detail(engine: AIOEngine, record_id: str, user_id: str) -> Optional[BorrowRecord]:
    return await engine.find_one(BorrowRecord, (BorrowRecord.id == ObjectId(record_id)) & (BorrowRecord.reader == ObjectId(user_id)))

async def get_record_items(engine: AIOEngine, record_id: str) -> List[BorrowRecordItem]:
    collection = engine.get_collection(BorrowRecordItem)
    raw = await collection.find({"borrow_record": ObjectId(record_id)}).to_list(length=None)
    items: List[BorrowRecordItem] = []
    for doc in raw:
        item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == doc["_id"])
        if item:
            items.append(item)
    return items

async def get_record_items_dict(engine: AIOEngine, record_id: str) -> List[dict]:
    """Get all items in a borrow record as raw dicts from MongoDB to avoid ODMantic reference resolution errors."""
    collection = engine.get_collection(BorrowRecordItem)
    raw = await collection.find({"borrow_record": ObjectId(record_id)}).to_list(length=None)
    return raw

# Renewal
async def create_renewal_request(engine: AIOEngine, item_id: str, user_id: str, new_due_date: date) -> RenewalRequest:
    # Find the item and ensure it belongs to the user
    item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == ObjectId(item_id))
    if not item:
        raise ValueError("Borrow record item not found")
        
    # Check if record belongs to user
    record = await engine.find_one(BorrowRecord, BorrowRecord.id == item.borrow_record.id)
    if not record or str(record.reader.id) != user_id:
        raise ValueError("Unauthorized access to this borrow record")
        
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    
    # Each borrowed item can only have one active/successful renewal.
    collection = engine.get_collection(RenewalRequest)
    existing_raw = await collection.find_one({"borrow_record_item": ObjectId(item_id), "status": "pending"})
    if existing_raw:
        raise ValueError("A renewal request is already pending for this item")

    approved_raw = await collection.find_one({"borrow_record_item": ObjectId(item_id), "status": "approved"})
    if approved_raw:
        raise ValueError("This item has already been renewed")
        
    db_obj = RenewalRequest(
        borrow_record_item=item,
        requested_by=user,
        new_due_date=datetime.combine(new_due_date, datetime.min.time()),
        status="pending"
    )
    await engine.save(db_obj)
    
    # Notify librarians
    item_obj = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == db_obj.borrow_record_item.id)
    copy_code_info = ""
    if item_obj:
        copy_obj = await engine.find_one(DocumentCopy, DocumentCopy.id == item_obj.document_copy.id)
        if copy_obj:
            doc_obj = await engine.find_one(Document, Document.id == copy_obj.document.id)
            copy_code_info = f" cho sách \"{doc_obj.title}\"" if doc_obj else f" (mã bản sao: {copy_obj.copy_code})"
    await notify_librarians(
        engine,
        title="Yêu cầu gia hạn mới",
        message=f"Độc giả {user.username} vừa yêu cầu gia hạn{copy_code_info}. Hạn mới: {new_due_date.strftime('%d/%m/%Y')}.",
        notif_type="new_renewal_request"
    )
    
    return db_obj

async def get_my_renewals(engine: AIOEngine, user_id: str) -> List[RenewalRequest]:
    collection = engine.get_collection(RenewalRequest)
    raw = await collection.find({"requested_by": ObjectId(user_id)}).sort("request_date", -1).to_list(length=None)
    requests: List[RenewalRequest] = []
    for doc in raw:
        item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == doc.get("borrow_record_item"))
        if not item or item.return_date is not None:
            continue
        request = await engine.find_one(RenewalRequest, RenewalRequest.id == doc["_id"])
        if request:
            requests.append(request)
    return requests


# ===================== LIBRARIAN OPERATIONS =====================

async def create_borrow_record(
    engine: AIOEngine,
    reader_id: str,
    librarian_id: str,
    copy_codes: List[str],
    notes: Optional[str] = None,
) -> BorrowRecord:
    """Create a borrow record with items from copy codes."""
    reader = await engine.find_one(User, User.id == ObjectId(reader_id))
    if not reader:
        raise ValueError("Reader not found")

    librarian = await engine.find_one(User, User.id == ObjectId(librarian_id))
    if not librarian:
        raise ValueError("Librarian not found")

    # Get library settings for limits
    from app.crud.setting import get_setting
    max_books_setting = await get_setting(engine, "default_max_books")
    max_days_setting = await get_setting(engine, "default_max_days")
    max_books = int(max_books_setting.setting_value) if max_books_setting else 5
    max_days = int(max_days_setting.setting_value) if max_days_setting else 14

    # Use per-user override if set
    if reader.max_books_allowed is not None:
        max_books = reader.max_books_allowed
    if reader.max_days_allowed is not None:
        max_days = reader.max_days_allowed

    # Check current active borrows count
    active_records = await engine.find(
        BorrowRecord,
        (BorrowRecord.reader == reader.id) & (BorrowRecord.status == "borrowed")
    )
    current_borrowed = 0
    for rec in active_records:
        items = await engine.find(
            BorrowRecordItem,
            (BorrowRecordItem.borrow_record == rec.id) & (BorrowRecordItem.return_date == None)
        )
        current_borrowed += len(items)

    if current_borrowed + len(copy_codes) > max_books:
        raise ValueError(
            {
                "code": "borrow_limit_exceeded",
                "message": f"Bạn đang mượn {current_borrowed} cuốn, giới hạn là {max_books}.",
                "current_borrowed": current_borrowed,
                "cart_size": len(copy_codes),
                "max_books": max_books,
            }
        )

    # Validate all copies
    copies = []
    for code in copy_codes:
        copy = await engine.find_one(DocumentCopy, DocumentCopy.copy_code == code)
        if not copy:
            raise ValueError(f"Copy with code '{code}' not found")
        if copy.status != "available":
            raise ValueError(f"Copy '{code}' is not available")
        copies.append(copy)

    # Create the borrow record
    record = BorrowRecord(
        reader=reader,
        librarian=librarian,
        borrow_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=max_days),
        status="borrowed",
        notes=notes,
    )
    await engine.save(record)

    # Create items and update copy/document
    for copy in copies:
        item = BorrowRecordItem(borrow_record=record, document_copy=copy, due_date=record.due_date)
        await engine.save(item)
        copy.status = "borrowed"
        await engine.save(copy)

        doc = await engine.find_one(Document, Document.id == copy.document.id)
        if doc:
            doc.available_copies = max(0, doc.available_copies - 1)
            await engine.save(doc)

    return record


async def process_return(
    engine: AIOEngine,
    copy_code: str,
    condition_on_return: str = "good",
) -> BorrowRecordItem:
    """Process a book return by copy code."""
    copy = await engine.find_one(DocumentCopy, DocumentCopy.copy_code == copy_code)
    if not copy or copy.status != "borrowed":
        raise ValueError(f"Copy '{copy_code}' is not currently borrowed")

    item = await engine.find_one(
        BorrowRecordItem,
        (BorrowRecordItem.document_copy == copy.id) & (BorrowRecordItem.return_date == None)
    )
    if not item:
        raise ValueError(f"No active borrow record found for copy '{copy_code}'")

    item.return_date = datetime.utcnow()
    item.condition_on_return = condition_on_return
    await engine.save(item)

    renewal_collection = engine.get_collection(RenewalRequest)
    await renewal_collection.delete_many({"borrow_record_item": item.id})

    copy.status = "available"
    copy.condition = condition_on_return
    await engine.save(copy)

    doc = await engine.find_one(Document, Document.id == copy.document.id)
    if doc:
        doc.available_copies += 1
        await engine.save(doc)

    # Auto-close record if all items returned
    record = await engine.find_one(BorrowRecord, BorrowRecord.id == item.borrow_record.id)
    if record:
        all_items = await engine.find(BorrowRecordItem, BorrowRecordItem.borrow_record == record.id)
        if all(i.return_date is not None for i in all_items):
            record.status = "returned"
            await engine.save(record)
            
        # Notify user
        await create_notification(
            engine,
            user_id=str(record.reader.id),
            title="Đã trả sách",
            message=f"Cuốn sách có mã {copy_code} của bạn đã được ghi nhận trả thành công.",
            notif_type="checkin"
        )

    return item


async def get_all_borrow_records(
    engine: AIOEngine,
    status: Optional[str] = None,
    reader_id: Optional[str] = None,
    username: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[dict], int]:
    """Get all borrow records (librarian view) using raw MongoDB query to avoid ODMantic foreign key validation errors on deleted readers."""
    collection = engine.get_collection(BorrowRecord)
    
    query = {}
    if status:
        if status == "overdue":
            query["status"] = "borrowed"
            query["due_date"] = {"$lt": datetime.utcnow()}
        else:
            query["status"] = status
    if reader_id:
        query["reader"] = ObjectId(reader_id)
    if username:
        users_col = engine.get_collection(User)
        user_ids = await users_col.distinct("_id", {
            "$or": [
                {"username": {"$regex": username, "$options": "i"}},
                {"full_name": {"$regex": username, "$options": "i"}},
                {"email": {"$regex": username, "$options": "i"}}
            ]
        })
        if user_ids:
            query["reader"] = {"$in": user_ids}
        else:
            return [], 0

    if start_date or end_date:
        date_query = {}
        if start_date:
            try:
                dt_start = datetime.strptime(start_date, "%Y-%m-%d")
                date_query["$gte"] = dt_start
            except ValueError:
                pass
        if end_date:
            try:
                dt_end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                date_query["$lt"] = dt_end
            except ValueError:
                pass
        if date_query:
            query["borrow_date"] = date_query
        
    total = await collection.count_documents(query)
    
    cursor = collection.find(query).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    records = await cursor.to_list(length=page_size)
    
    return records, total


async def get_return_history(
    engine: AIOEngine,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[dict], int]:
    """Get history of returned items with reader info."""
    collection = engine.get_collection(BorrowRecordItem)
    
    pipeline = [
        {"$match": {"return_date": {"$ne": None}}},
        {"$sort": {"return_date": -1}},
        {
            "$facet": {
                "metadata": [{"$count": "total"}],
                "data": [
                    {"$skip": (page - 1) * page_size},
                    {"$limit": page_size},
                    {
                        "$lookup": {
                            "from": "borrow_records",
                            "localField": "borrow_record",
                            "foreignField": "_id",
                            "as": "borrow_record_doc"
                        }
                    },
                    {"$unwind": "$borrow_record_doc"},
                    {
                        "$lookup": {
                            "from": "users",
                            "localField": "borrow_record_doc.reader",
                            "foreignField": "_id",
                            "as": "reader_doc"
                        }
                    },
                    {"$unwind": "$reader_doc"},
                    {
                        "$lookup": {
                            "from": "document_copies",
                            "localField": "document_copy",
                            "foreignField": "_id",
                            "as": "copy_doc"
                        }
                    },
                    {"$unwind": "$copy_doc"},
                    {
                        "$lookup": {
                            "from": "documents",
                            "localField": "copy_doc.document",
                            "foreignField": "_id",
                            "as": "document_doc"
                        }
                    },
                    {"$unwind": "$document_doc"}
                ]
            }
        }
    ]
    
    result = await collection.aggregate(pipeline).to_list(1)
    if not result:
        return [], 0
        
    res = result[0]
    total = res["metadata"][0]["total"] if res["metadata"] else 0
    data = res["data"]
    
    formatted = []
    for d in data:
        formatted.append({
            "id": d["_id"],
            "copy_code": d["copy_doc"]["copy_code"],
            "document_title": d["document_doc"]["title"],
            "reader_name": d["reader_doc"].get("full_name") or d["reader_doc"].get("username", "Unknown"),
            "reader_username": d["reader_doc"].get("username", ""),
            "reader_email": d["reader_doc"].get("email", ""),
            "condition_on_return": d.get("condition_on_return", "good"),
            "return_date": d["return_date"]
        })
        
    return formatted, total


async def review_renewal(
    engine: AIOEngine,
    renewal_id: str,
    librarian_id: str,
    new_status: str,
    reject_reason: Optional[str] = None,
) -> RenewalRequest:
    """Approve or reject a renewal request."""
    renewal = await engine.find_one(RenewalRequest, RenewalRequest.id == ObjectId(renewal_id))
    if not renewal or renewal.status != "pending":
        raise ValueError("Renewal request not found or not pending")

    renewal.status = new_status
    renewal.reviewed_by_id = librarian_id
    renewal.reviewed_at = datetime.utcnow()
    if new_status == "rejected":
        renewal.reject_reason = reject_reason
    elif new_status == "approved":
        item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == renewal.borrow_record_item.id)
        if item:
            item.due_date = renewal.new_due_date
            await engine.save(item)
            
            # Notify user
            record = await engine.find_one(BorrowRecord, BorrowRecord.id == item.borrow_record.id)
            if record:
                await create_notification(
                    engine,
                    user_id=str(record.reader.id),
                    title="Gia hạn sách thành công",
                    message="Yêu cầu gia hạn sách của bạn đã được thủ thư phê duyệt.",
                    notif_type="renewal_approved"
                )

    await engine.save(renewal)
    return renewal


async def get_pending_renewals(
    engine: AIOEngine,
    status_filter: str = "pending",
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[RenewalRequest], int]:
    """Get renewal requests for review."""
    if status_filter == "all_history":
        query = RenewalRequest.status != "pending"
    else:
        query = RenewalRequest.status == status_filter
        
    total = await engine.count(RenewalRequest, query)
    records = await engine.find(
        RenewalRequest, 
        query, 
        skip=(page - 1) * page_size, limit=page_size,
        sort=RenewalRequest.request_date.desc()
    )
    return list(records), total

