from __future__ import annotations
from datetime import datetime, date
from typing import Optional
from odmantic import Model, Field, Reference
from pydantic import model_validator
from .user import User
from .document import Document, DocumentCopy

class Wishlist(Model):
    user: User = Reference()
    document: Document = Reference()
    added_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "wishlists"
    }

class BorrowCartItem(Model):
    user: User = Reference()
    document: Document = Reference()
    added_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "borrow_cart_items"
    }

class BorrowRecord(Model):
    reader: User = Reference()
    librarian: User = Reference()
    borrow_date: datetime
    due_date: datetime
    status: str = Field(default="borrowed")
    notes: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "borrow_records"
    }

    @model_validator(mode="before")
    def _coerce_dates(cls, values: dict):
        # Some stored documents contain datetimes for date-only fields; coerce them to date
        for k in ("borrow_date", "due_date"):
            v = values.get(k)
            if isinstance(v, datetime):
                values[k] = v.date()
        return values

class BorrowRecordItem(Model):
    borrow_record: BorrowRecord = Reference()
    document_copy: DocumentCopy = Reference()
    return_date: datetime | None = Field(default=None)
    condition_on_return: str | None = Field(default=None)
    due_date: datetime | None = Field(default=None)

    model_config = {
        "collection": "borrow_record_items"
    }

    @model_validator(mode="before")
    def _coerce_dates(cls, values: dict):
        for k in ("return_date", "due_date"):
            v = values.get(k)
            if isinstance(v, datetime):
                values[k] = v.date()
        return values

class RenewalRequest(Model):
    borrow_record_item: BorrowRecordItem = Reference()
    requested_by: User = Reference()
    request_date: datetime = Field(default_factory=datetime.utcnow)
    new_due_date: datetime
    status: str = Field(default="pending")
    reviewed_by_id: str | None = Field(default=None)
    reviewed_at: datetime | None = Field(default=None)
    reject_reason: str | None = Field(default=None)

    model_config = {
        "collection": "renewal_requests"
    }

    @model_validator(mode="before")
    def _coerce_new_due_date(cls, values: dict):
        v = values.get("new_due_date")
        if isinstance(v, datetime):
            values["new_due_date"] = v.date()
        return values
