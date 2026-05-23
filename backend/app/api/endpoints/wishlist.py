from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.db.session import engine
from app.api import deps
from app.models.document import Document
from app.models.user import User
from app.schemas import borrow as borrow_schema
from app.crud import borrow as borrow_crud

router = APIRouter()

def _resolve_reference_id(ref):
    return ref.id if hasattr(ref, "id") else ref

@router.get("", response_model=List[borrow_schema.WishlistResponse])
async def get_my_wishlist(
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Get current user's wishlist.
    """
    wishlists = await borrow_crud.get_wishlists(engine, str(current_user.id))
    
    response = []
    for item in wishlists:
        # Load document
        doc_id = _resolve_reference_id(item.document)
        doc = await engine.find_one(Document, Document.id == doc_id)
        response.append(borrow_schema.WishlistResponse(
            id=item.id,
            document_id=doc.id,
            document_title=doc.title,
            author=doc.author,
            cover_image=doc.cover_image,
            added_at=item.added_at
        ))
    return response

@router.post("", response_model=borrow_schema.WishlistResponse)
async def add_to_wishlist(
    wishlist_in: borrow_schema.WishlistCreate,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Add a document to wishlist.
    """
    try:
        item = await borrow_crud.add_to_wishlist(engine, str(current_user.id), wishlist_in.document_id)
        doc_id = _resolve_reference_id(item.document)
        doc = await engine.find_one(Document, Document.id == doc_id)
        return borrow_schema.WishlistResponse(
            id=item.id,
            document_id=doc.id,
            document_title=doc.title,
            author=doc.author,
            cover_image=doc.cover_image,
            added_at=item.added_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}")
async def remove_from_wishlist(
    id: str,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Remove an item from wishlist.
    """
    success = await borrow_crud.remove_from_wishlist(engine, id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return {"status": "success"}
