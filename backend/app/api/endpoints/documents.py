from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from app.db.session import engine
from app.schemas import document as document_schema
from app.crud import document as document_crud

router = APIRouter()

@router.get("/", response_model=document_schema.DocumentSearchResponse)
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
    for doc in docs:
        # Need to fetch category for name if not loaded
        category = await engine.find_one(doc.category.model, doc.category.model.id == doc.category.id)
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

@router.get("/categories", response_model=List[document_schema.Category])
async def get_categories() -> Any:
    """
    Get all document categories.
    """
    return await document_crud.get_categories(engine)

@router.get("/{id}", response_model=document_schema.Document)
async def get_document(id: str) -> Any:
    """
    Get detailed information about a document.
    """
    doc = await document_crud.get_document_by_id(engine, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
