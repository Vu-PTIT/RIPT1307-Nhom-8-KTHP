from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import document as document_schema
from app.crud import document as document_crud

router = APIRouter()

@router.get("", response_model=List[document_schema.Category])
async def get_categories() -> Any:
    """
    Get all document categories.
    """
    return await document_crud.get_categories(engine)


@router.post("", response_model=document_schema.Category)
async def create_category(
    cat_in: document_schema.CategoryCreate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Create a new category (Librarian/Admin only)."""
    try:
        return await document_crud.create_category(
            engine, name=cat_in.name, slug=cat_in.slug, parent_id=cat_in.parent_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{id}", response_model=document_schema.Category)
async def update_category(
    id: str, cat_in: document_schema.CategoryUpdate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Update a category (Librarian/Admin only)."""
    try:
        update_data = cat_in.model_dump(exclude_unset=True)
        return await document_crud.update_category(engine, id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{id}")
async def delete_category(
    id: str, current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Delete a category (Librarian/Admin only)."""
    try:
        await document_crud.delete_category(engine, id)
        return {"message": "Category deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
