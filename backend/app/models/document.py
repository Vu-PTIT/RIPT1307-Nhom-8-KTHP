from __future__ import annotations
from datetime import datetime
from typing import Optional
from odmantic import Model, Field, Reference
from .user import User

class Category(Model):
    parent_id: str | None = Field(default=None)
    name: str
    slug: str = Field(unique=True)

    model_config = {
        "collection": "categories"
    }

class Document(Model):
    category: Category = Reference()
    title: str
    author: str
    isbn: str | None = Field(default=None)
    description: str | None = Field(default=None)
    cover_image: str | None = Field(default=None)
    total_copies: int = Field(default=0)
    available_copies: int = Field(default=0)
    created_by: User = Reference()
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "documents"
    }

class DocumentCopy(Model):
    document: Document = Reference()
    copy_code: str = Field(unique=True)
    condition: str = Field(default="good")
    status: str = Field(default="available")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "document_copies"
    }
