from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel
from .user import User, PyObjectId
from .document import Document, DocumentCopy, DocumentSummary

# Wishlist Schemas
class WishlistBase(BaseModel):
    pass

class WishlistCreate(WishlistBase):
    document_id: str

class Wishlist(WishlistBase):
    id: PyObjectId
    user: User
    document: Document
    added_at: datetime

    class Config:
        from_attributes = True

class WishlistResponse(BaseModel):
    id: PyObjectId
    document_id: PyObjectId
    document_title: str
    author: str
    cover_image: Optional[str] = None
    available_copies: int = 0
    added_at: datetime

# BorrowCartItem Schemas
class BorrowCartItemBase(BaseModel):
    pass

class BorrowCartItemCreate(BorrowCartItemBase):
    document_id: str

class BorrowCartItem(BorrowCartItemBase):
    id: PyObjectId
    user: User
    document: Document
    added_at: datetime

    class Config:
        from_attributes = True

class BorrowCartItemResponse(BaseModel):
    id: PyObjectId
    document_id: PyObjectId
    document_title: str
    author: str
    cover_image: Optional[str] = None
    available_copies: int = 0
    added_at: datetime

# BorrowRecord Schemas
class BorrowRecordBase(BaseModel):
    borrow_date: date
    due_date: date
    status: str = "borrowed"
    notes: Optional[str] = None

class BorrowRecordCreate(BorrowRecordBase):
    reader_id: str
    librarian_id: str

class BorrowRecordUpdate(BaseModel):
    borrow_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class BorrowRecord(BorrowRecordBase):
    id: PyObjectId
    reader: User
    librarian: User
    created_at: datetime

    class Config:
        from_attributes = True

# BorrowRecordItem Schemas
class BorrowRecordItemBase(BaseModel):
    return_date: Optional[date] = None
    condition_on_return: Optional[str] = None
    due_date: Optional[date] = None

class BorrowRecordItemCreate(BorrowRecordItemBase):
    borrow_record_id: str
    copy_id: str

class BorrowRecordItemUpdate(BaseModel):
    return_date: Optional[date] = None
    condition_on_return: Optional[str] = None

class BorrowRecordItem(BorrowRecordItemBase):
    id: PyObjectId
    borrow_record: BorrowRecord
    document_copy: DocumentCopy

    class Config:
        from_attributes = True

class BorrowRecordItemSummary(BaseModel):
    id: PyObjectId
    copy_code: str
    document_title: str
    author: Optional[str] = None
    cover_image: Optional[str] = None
    borrow_date: date
    due_date: date
    return_date: Optional[date] = None
    status: str
    renewal_count: Optional[int] = 0

class BorrowRecordDetailResponse(BaseModel):
    id: PyObjectId
    borrow_date: date
    due_date: date
    status: str
    items: List[BorrowRecordItemSummary]

class BorrowRecordSummaryResponse(BaseModel):
    id: PyObjectId
    borrow_date: date
    due_date: date
    status: str
    notes: Optional[str] = None

# RenewalRequest Schemas
class RenewalRequestBase(BaseModel):
    new_due_date: date
    status: str = "pending"
    reject_reason: Optional[str] = None

class RenewalRequestCreate(BaseModel):
    borrow_record_item_id: str
    new_due_date: date

class RenewalRequestModify(BaseModel):
    new_due_date: date

class RenewalRequestUpdate(BaseModel):
    status: Optional[str] = None
    reviewed_by_id: Optional[str] = None
    reject_reason: Optional[str] = None

class RenewalRequest(RenewalRequestBase):
    id: PyObjectId
    borrow_record_item: BorrowRecordItem
    requested_by: User
    request_date: datetime
    reviewed_by_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RenewalRequestResponse(BaseModel):
    id: PyObjectId
    borrow_record_item_id: str
    document_title: str
    author: Optional[str] = None
    cover_image: Optional[str] = None
    borrow_date: Optional[datetime] = None
    old_due_date: datetime
    new_due_date: datetime
    status: str
    request_date: datetime
    reviewed_at: Optional[datetime] = None
    reject_reason: Optional[str] = None
    # Librarian-facing extra fields
    reader_name: Optional[str] = None
    reader_username: Optional[str] = None
    renewal_count: Optional[int] = None
    copy_code: Optional[str] = None

# ====== Librarian Schemas ======

class LibrarianBorrowCreate(BaseModel):
    """Schema for librarian to create a borrow record at the counter."""
    reader_id: str
    copy_codes: List[str]
    notes: Optional[str] = None

class LibrarianReturnRequest(BaseModel):
    """Schema for librarian to process a book return."""
    copy_code: str
    condition_on_return: str = "good"

class RenewalReviewRequest(BaseModel):
    """Schema for librarian to approve/reject a renewal request."""
    status: str  # "approved" or "rejected"
    reject_reason: Optional[str] = None

class BorrowRecordListItem(BaseModel):
    """Schema for listing borrow records (librarian view, includes reader info)."""
    id: PyObjectId
    reader_username: str
    reader_email: str
    reader_avatar: Optional[str] = None
    borrow_date: date
    due_date: date
    status: str
    item_count: int
    copy_codes: List[str] = []
    items: List[dict] = []
    created_at: datetime

class ReturnHistoryItem(BaseModel):
    """Schema for return history item."""
    id: PyObjectId
    copy_code: str
    document_title: str
    reader_name: str
    reader_username: str
    reader_email: str
    condition_on_return: str
    return_date: datetime

class ReturnHistoryResponse(BaseModel):
    """Schema for return history list response."""
    items: List[ReturnHistoryItem]
    total: int
    page: int
    page_size: int

class RenewalRequestListResponse(BaseModel):
    """Schema for renewal request list response."""
    items: List[RenewalRequestResponse]
    total: int
    page: int
    page_size: int
