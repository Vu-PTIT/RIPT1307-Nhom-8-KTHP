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
