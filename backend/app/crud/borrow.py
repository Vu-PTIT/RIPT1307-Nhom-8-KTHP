from __future__ import annotations
from datetime import datetime, date, timedelta
from typing import Optional, List
from odmantic import AIOEngine, ObjectId
from app.models.borrow import Wishlist, BorrowCartItem, BorrowRecord, BorrowRecordItem, RenewalRequest
from app.models.document import Document, DocumentCopy
from app.models.user import User

# Wishlist
async def get_wishlists(engine: AIOEngine, user_id: str) -> List[Wishlist]:
    return await engine.find(Wishlist, Wishlist.user == ObjectId(user_id))

async def add_to_wishlist(engine: AIOEngine, user_id: str, doc_id: str) -> Wishlist:
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    doc = await engine.find_one(Document, Document.id == ObjectId(doc_id))
    if not user or not doc:
        raise ValueError("User or Document not found")
    
    existing = await engine.find_one(Wishlist, (Wishlist.user == user.id) & (Wishlist.document == doc.id))
    if existing:
        return existing
        
    db_obj = Wishlist(user=user, document=doc)
    await engine.save(db_obj)
    return db_obj

async def remove_from_wishlist(engine: AIOEngine, wishlist_id: str, user_id: str) -> bool:
    obj = await engine.find_one(Wishlist, (Wishlist.id == ObjectId(wishlist_id)) & (Wishlist.user == ObjectId(user_id)))
    if obj:
        await engine.delete(obj)
        return True
    return False

# Borrow Cart
async def get_cart_items(engine: AIOEngine, user_id: str) -> List[BorrowCartItem]:
    return await engine.find(BorrowCartItem, BorrowCartItem.user == ObjectId(user_id))

async def add_to_cart(engine: AIOEngine, user_id: str, doc_id: str) -> BorrowCartItem:
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    doc = await engine.find_one(Document, Document.id == ObjectId(doc_id))
    if not user or not doc:
        raise ValueError("User or Document not found")
        
    # Check if document has available copies
    if doc.available_copies <= 0:
        raise ValueError("No available copies for this document")
        
    existing = await engine.find_one(BorrowCartItem, (BorrowCartItem.user == user.id) & (BorrowCartItem.document == doc.id))
    if existing:
        return existing
        
    db_obj = BorrowCartItem(user=user, document=doc)
    await engine.save(db_obj)
    return db_obj

async def remove_from_cart(engine: AIOEngine, cart_item_id: str, user_id: str) -> bool:
    obj = await engine.find_one(BorrowCartItem, (BorrowCartItem.id == ObjectId(cart_item_id)) & (BorrowCartItem.user == ObjectId(user_id)))
    if obj:
        await engine.delete(obj)
        return True
    return False

async def clear_cart(engine: AIOEngine, user_id: str):
    items = await engine.find(BorrowCartItem, BorrowCartItem.user == ObjectId(user_id))
    for item in items:
        await engine.delete(item)

# Borrow Records
async def get_my_borrow_records(engine: AIOEngine, user_id: str, status: Optional[str] = None) -> List[BorrowRecord]:
    filters = [BorrowRecord.reader == ObjectId(user_id)]
    if status:
        filters.append(BorrowRecord.status == status)
    return await engine.find(BorrowRecord, *filters, sort=BorrowRecord.borrow_date.desc())

async def get_borrow_record_detail(engine: AIOEngine, record_id: str, user_id: str) -> Optional[BorrowRecord]:
    return await engine.find_one(BorrowRecord, (BorrowRecord.id == ObjectId(record_id)) & (BorrowRecord.reader == ObjectId(user_id)))

async def get_record_items(engine: AIOEngine, record_id: str) -> List[BorrowRecordItem]:
    return await engine.find(BorrowRecordItem, BorrowRecordItem.borrow_record == ObjectId(record_id))

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
    
    # Check if there is already a pending request
    existing = await engine.find_one(RenewalRequest, (RenewalRequest.borrow_record_item == item.id) & (RenewalRequest.status == "pending"))
    if existing:
        raise ValueError("A renewal request is already pending for this item")
        
    db_obj = RenewalRequest(
        borrow_record_item=item,
        requested_by=user,
        new_due_date=new_due_date,
        status="pending"
    )
    await engine.save(db_obj)
    return db_obj

async def get_my_renewals(engine: AIOEngine, user_id: str) -> List[RenewalRequest]:
    return await engine.find(RenewalRequest, RenewalRequest.requested_by == ObjectId(user_id), sort=RenewalRequest.request_date.desc())


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
            f"Exceeds borrow limit. Currently borrowing {current_borrowed}, limit is {max_books}"
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
        borrow_date=date.today(),
        due_date=date.today() + timedelta(days=max_days),
        status="borrowed",
        notes=notes,
    )
    await engine.save(record)

    # Create items and update copy/document
    for copy in copies:
        item = BorrowRecordItem(borrow_record=record, document_copy=copy)
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

    item.return_date = date.today()
    item.condition_on_return = condition_on_return
    await engine.save(item)

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

    return item


async def get_all_borrow_records(
    engine: AIOEngine,
    status: Optional[str] = None,
    reader_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[BorrowRecord], int]:
    """Get all borrow records (librarian view)."""
    filters = []
    if status:
        filters.append(BorrowRecord.status == status)
    if reader_id:
        filters.append(BorrowRecord.reader == ObjectId(reader_id))

    total = await engine.count(BorrowRecord, *filters)
    records = await engine.find(
        BorrowRecord, *filters,
        skip=(page - 1) * page_size, limit=page_size,
        sort=BorrowRecord.created_at.desc()
    )
    return records, total


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
            record = await engine.find_one(BorrowRecord, BorrowRecord.id == item.borrow_record.id)
            if record:
                record.due_date = renewal.new_due_date
                await engine.save(record)

    await engine.save(renewal)
    return renewal


async def get_pending_renewals(
    engine: AIOEngine,
    status_filter: str = "pending",
) -> List[RenewalRequest]:
    """Get renewal requests for review."""
    return await engine.find(RenewalRequest, RenewalRequest.status == status_filter, sort=RenewalRequest.request_date.desc())

