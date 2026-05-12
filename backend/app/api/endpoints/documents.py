from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import document as document_schema
from app.crud import document as document_crud

router = APIRouter()

@router.get("", response_model=document_schema.DocumentSearchResponse)
async def search_documents(
    keyword: Optional[str] = None,
    category_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
) -> Any:
    """
    Search for documents with filters and pagination.
    """
    docs, total = await document_crud.search_documents(
        engine, keyword=keyword, category_id=category_id, page=page, page_size=page_size
    )
    
    # Map to summary schema
    items = []
    from app.models.document import Category
    for doc in docs:
        # Need to fetch category for name if not loaded
        category = await engine.find_one(Category, Category.id == doc.category.id)
        items.append(document_schema.DocumentSummary(
            id=doc.id,
            title=doc.title,
            author=doc.author,
            isbn=doc.isbn,
            cover_image=doc.cover_image,
            available_copies=doc.available_copies,
            category_name=category.name if category else "Unknown"
        ))
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/{id}", response_model=document_schema.Document)
async def get_document(id: str) -> Any:
    """
    Get detailed information about a document.
    """
    doc = await document_crud.get_document_by_id(engine, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


# ===================== LIBRARIAN ENDPOINTS =====================

@router.post("", response_model=document_schema.DocumentSummary)
async def create_document(
    doc_in: document_schema.DocumentCreate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Create a new document (Librarian/Admin only)."""
    try:
        doc = await document_crud.create_document(
            engine, title=doc_in.title, author=doc_in.author, category_id=doc_in.category_id,
            created_by_id=str(current_user.id), isbn=doc_in.isbn, description=doc_in.description,
            cover_image=doc_in.cover_image
        )
        from app.models.document import Category
        category = await engine.find_one(Category, Category.id == doc.category.id)
        return document_schema.DocumentSummary(
            id=doc.id, title=doc.title, author=doc.author, isbn=doc.isbn,
            cover_image=doc.cover_image, available_copies=doc.available_copies,
            category_name=category.name if category else "Unknown"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{id}", response_model=document_schema.DocumentSummary)
async def update_document(
    id: str, doc_in: document_schema.DocumentUpdate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Update a document (Librarian/Admin only)."""
    try:
        update_data = doc_in.model_dump(exclude_unset=True)
        doc = await document_crud.update_document(engine, id, update_data)
        from app.models.document import Category
        category = await engine.find_one(Category, Category.id == doc.category.id)
        return document_schema.DocumentSummary(
            id=doc.id, title=doc.title, author=doc.author, isbn=doc.isbn,
            cover_image=doc.cover_image, available_copies=doc.available_copies,
            category_name=category.name if category else "Unknown"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{id}")
async def delete_document(
    id: str, current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Delete a document and all its copies (Librarian/Admin only)."""
    try:
        await document_crud.delete_document(engine, id)
        return {"message": "Document deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{doc_id}/copies", response_model=document_schema.DocumentCopySummary)
async def create_copy(
    doc_id: str, copy_in: document_schema.DocumentCopyCreate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Add a new copy to a document (Librarian/Admin only)."""
    try:
        copy = await document_crud.create_document_copy(
            engine, doc_id=doc_id, copy_code=copy_in.copy_code, condition=copy_in.condition
        )
        return document_schema.DocumentCopySummary(
            id=copy.id, copy_code=copy.copy_code, condition=copy.condition,
            status=copy.status, created_at=copy.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{doc_id}/copies", response_model=List[document_schema.DocumentCopySummary])
async def list_copies(
    doc_id: str, current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """List all copies of a document (Librarian/Admin only)."""
    copies = await document_crud.get_document_copies(engine, doc_id)
    return [
        document_schema.DocumentCopySummary(
            id=c.id, copy_code=c.copy_code, condition=c.condition,
            status=c.status, created_at=c.created_at
        ) for c in copies
    ]


@router.put("/copies/{id}", response_model=document_schema.DocumentCopySummary)
async def update_copy(
    id: str, copy_in: document_schema.DocumentCopyUpdate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Update a document copy (Librarian/Admin only)."""
    try:
        update_data = copy_in.model_dump(exclude_unset=True)
        copy = await document_crud.update_document_copy(engine, id, update_data)
        return document_schema.DocumentCopySummary(
            id=copy.id, copy_code=copy.copy_code, condition=copy.condition,
            status=copy.status, created_at=copy.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/copies/{id}")
async def delete_copy(
    id: str, current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Delete a document copy (Librarian/Admin only)."""
    try:
        await document_crud.delete_document_copy(engine, id)
        return {"message": "Document copy deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
