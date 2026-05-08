from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from .user import User

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    slug: str

class CategoryCreate(CategoryBase):
    parent_id: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    parent_id: Optional[str] = None

class Category(CategoryBase):
    id: str
    parent: Optional["Category"] = None

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    total_copies: int = 0
    available_copies: int = 0

class DocumentCreate(DocumentBase):
    category_id: str

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None
    category_id: Optional[str] = None

class Document(DocumentBase):
    id: str
    category: Category
    created_by: User
    created_at: datetime

    class Config:
        from_attributes = True

# DocumentCopy Schemas
class DocumentCopyBase(BaseModel):
    copy_code: str
    condition: str = "good"
    status: str = "available"

class DocumentCopyCreate(DocumentCopyBase):
    document_id: str

class DocumentCopyUpdate(BaseModel):
    copy_code: Optional[str] = None
    condition: Optional[str] = None
    status: Optional[str] = None

class DocumentCopy(DocumentCopyBase):
    id: str
    document: Document
    created_at: datetime

    class Config:
        from_attributes = True
