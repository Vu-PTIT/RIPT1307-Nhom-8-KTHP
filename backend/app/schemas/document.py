from datetime import datetime
from typing import Optional, Annotated
from pydantic import BaseModel, Field, BeforeValidator
from .user import User, PyObjectId

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
    id: PyObjectId
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
    id: PyObjectId
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
    id: PyObjectId
    document: Document
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentSummary(BaseModel):
    id: PyObjectId
    title: str
    author: str
    isbn: Optional[str] = None
    cover_image: Optional[str] = None
    available_copies: int
    category_name: str

class DocumentSearchResponse(BaseModel):
    items: list[DocumentSummary]
    total: int
    page: int
    page_size: int

class DocumentCopySummary(BaseModel):
    id: PyObjectId
    copy_code: str
    condition: str
    status: str
    created_at: datetime

