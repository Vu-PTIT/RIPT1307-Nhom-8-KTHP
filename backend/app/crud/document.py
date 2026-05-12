from __future__ import annotations
from typing import List, Optional, Tuple
from odmantic import AIOEngine, ObjectId
from app.models.document import Document, Category, DocumentCopy
from app.schemas.document import DocumentSearchResponse, DocumentSummary

async def search_documents(
    engine: AIOEngine, 
    keyword: Optional[str] = None, 
    category_id: Optional[str] = None, 
    page: int = 1, 
    page_size: int = 10
) -> Tuple[List[Document], int]:
    query = {}
    if keyword:
        # Simple regex search for title or author
        query["$or"] = [
            {"title": {"$regex": keyword, "$options": "i"}},
            {"author": {"$regex": keyword, "$options": "i"}},
            {"isbn": {"$regex": keyword, "$options": "i"}}
        ]
    
    if category_id:
        query["category"] = ObjectId(category_id)
    
    # Odmantic doesn't support complex mongo queries directly in find easily for all cases,
    # but we can use the engine.find with a query object if needed or use the built-in filters.
    # For now, let's use the built-in filters if possible, or motor directly if complex.
    
    filters = []
    if category_id:
        filters.append(Document.category == ObjectId(category_id))
    
    # Keyword search is tricky with Odmantic's high-level API if we want OR.
    # Let's use the underlying motor collection for advanced search or stay simple.
    # Simple approach for now:
    
    if keyword:
        # Odmantic doesn't have a clean $or with regex in the high-level API yet.
        # We'll use the motor collection.
        collection = engine.get_collection(Document)
        mongo_query = {}
        if category_id:
            mongo_query["category"] = ObjectId(category_id)
        if keyword:
            mongo_query["$or"] = [
                {"title": {"$regex": keyword, "$options": "i"}},
                {"author": {"$regex": keyword, "$options": "i"}},
                {"isbn": {"$regex": keyword, "$options": "i"}}
            ]
        
        total = await collection.count_documents(mongo_query)
        cursor = collection.find(mongo_query).skip((page - 1) * page_size).limit(page_size)
        docs_raw = await cursor.to_list(length=page_size)
        docs = [engine.database_to_model(Document, doc) for doc in docs_raw]
        return docs, total
    else:
        total = await engine.count(Document, *filters)
        docs = await engine.find(
            Document, 
            *filters, 
            skip=(page - 1) * page_size, 
            limit=page_size,
            sort=Document.title
        )
        return docs, total

async def get_document_by_id(engine: AIOEngine, doc_id: str) -> Optional[Document]:
    return await engine.find_one(Document, Document.id == ObjectId(doc_id))

async def get_categories(engine: AIOEngine) -> List[Category]:
    return await engine.find(Category, sort=Category.name)


# ===================== LIBRARIAN OPERATIONS =====================

async def create_document(
    engine: AIOEngine,
    title: str,
    author: str,
    category_id: str,
    created_by_id: str,
    isbn: Optional[str] = None,
    description: Optional[str] = None,
    cover_image: Optional[str] = None,
) -> Document:
    """Create a new document."""
    from app.models.user import User
    category = await engine.find_one(Category, Category.id == ObjectId(category_id))
    if not category:
        raise ValueError("Category not found")
    user = await engine.find_one(User, User.id == ObjectId(created_by_id))
    doc = Document(
        category=category, title=title, author=author, isbn=isbn,
        description=description, cover_image=cover_image,
        created_by=user,
    )
    await engine.save(doc)
    return doc


async def update_document(engine: AIOEngine, doc_id: str, update_data: dict) -> Document:
    """Update a document's fields."""
    doc = await engine.find_one(Document, Document.id == ObjectId(doc_id))
    if not doc:
        raise ValueError("Document not found")
    if "category_id" in update_data:
        category = await engine.find_one(Category, Category.id == ObjectId(update_data.pop("category_id")))
        if category: doc.category = category
    for key, value in update_data.items():
        if value is not None and hasattr(doc, key):
            setattr(doc, key, value)
    await engine.save(doc)
    return doc


async def delete_document(engine: AIOEngine, doc_id: str) -> bool:
    """Delete document if no active borrows."""
    from app.models.document import DocumentCopy
    doc = await engine.find_one(Document, Document.id == ObjectId(doc_id))
    if not doc: return False
    copies = await engine.find(DocumentCopy, DocumentCopy.document == doc.id)
    if any(c.status == "borrowed" for c in copies):
        raise ValueError("Cannot delete document with active borrows")
    for c in copies: await engine.delete(c)
    await engine.delete(doc)
    return True


async def create_document_copy(engine: AIOEngine, doc_id: str, copy_code: str, condition: str = "good") -> DocumentCopy:
    """Add a new copy to a document."""
    from app.models.document import DocumentCopy
    doc = await engine.find_one(Document, Document.id == ObjectId(doc_id))
    if not doc: raise ValueError("Document not found")
    if await engine.find_one(DocumentCopy, DocumentCopy.copy_code == copy_code):
        raise ValueError("Copy code already exists")
    copy = DocumentCopy(document=doc, copy_code=copy_code, condition=condition, status="available")
    await engine.save(copy)
    doc.total_copies += 1
    doc.available_copies += 1
    await engine.save(doc)
    return copy


async def update_document_copy(engine: AIOEngine, copy_id: str, update_data: dict) -> DocumentCopy:
    """Update a document copy."""
    from app.models.document import DocumentCopy
    copy = await engine.find_one(DocumentCopy, DocumentCopy.id == ObjectId(copy_id))
    if not copy: raise ValueError("Copy not found")
    for key, value in update_data.items():
        if value is not None and hasattr(copy, key):
            setattr(copy, key, value)
    await engine.save(copy)
    return copy


async def delete_document_copy(engine: AIOEngine, copy_id: str) -> bool:
    """Delete a document copy."""
    from app.models.document import DocumentCopy
    copy = await engine.find_one(DocumentCopy, DocumentCopy.id == ObjectId(copy_id))
    if not copy or copy.status == "borrowed": return False
    doc = await engine.find_one(Document, Document.id == copy.document.id)
    if doc:
        doc.total_copies -= 1
        if copy.status == "available": doc.available_copies -= 1
        await engine.save(doc)
    await engine.delete(copy)
    return True


async def get_document_copies(engine: AIOEngine, doc_id: str) -> List[DocumentCopy]:
    """Get all copies of a document."""
    from app.models.document import DocumentCopy
    return await engine.find(DocumentCopy, DocumentCopy.document == ObjectId(doc_id), sort=DocumentCopy.copy_code)


async def create_category(engine: AIOEngine, name: str, slug: str, parent_id: Optional[str] = None) -> Category:
    """Create a new category."""
    if await engine.find_one(Category, Category.slug == slug):
        raise ValueError("Slug already exists")
    cat = Category(name=name, slug=slug, parent_id=parent_id)
    await engine.save(cat)
    return cat


async def update_category(engine: AIOEngine, cat_id: str, update_data: dict) -> Category:
    """Update a category."""
    cat = await engine.find_one(Category, Category.id == ObjectId(cat_id))
    if not cat: raise ValueError("Category not found")
    for key, value in update_data.items():
        if value is not None and hasattr(cat, key):
            setattr(cat, key, value)
    await engine.save(cat)
    return cat


async def delete_category(engine: AIOEngine, cat_id: str) -> bool:
    """Delete category if empty."""
    cat = await engine.find_one(Category, Category.id == ObjectId(cat_id))
    if not cat: return False
    if await engine.count(Document, Document.category == cat.id) > 0:
        raise ValueError("Category is not empty")
    await engine.delete(cat)
    return True

