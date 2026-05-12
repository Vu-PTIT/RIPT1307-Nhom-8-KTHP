from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import borrow as borrow_schema
from app.crud import borrow as borrow_crud

router = APIRouter()

@router.get("/", response_model=List[borrow_schema.BorrowCartItemResponse])
async def get_my_cart(
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Get current user's borrow cart.
    """
    items = await borrow_crud.get_cart_items(engine, str(current_user.id))
    
    response = []
    for item in items:
        doc = await engine.find_one(item.document.model, item.document.model.id == item.document.id)
        response.append(borrow_schema.BorrowCartItemResponse(
            id=item.id,
            document_id=doc.id,
            document_title=doc.title,
            author=doc.author,
            cover_image=doc.cover_image,
            added_at=item.added_at
        ))
    return response

@router.post("/", response_model=borrow_schema.BorrowCartItemResponse)
async def add_to_cart(
    item_in: borrow_schema.BorrowCartItemCreate,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Add a document to borrow cart.
    """
    try:
        item = await borrow_crud.add_to_cart(engine, str(current_user.id), item_in.document_id)
        doc = await engine.find_one(item.document.model, item.document.model.id == item.document.id)
        return borrow_schema.BorrowCartItemResponse(
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
async def remove_from_cart(
    id: str,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Remove an item from borrow cart.
    """
    success = await borrow_crud.remove_from_cart(engine, id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"status": "success"}

@router.delete("/")
async def clear_cart(
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Clear all items from borrow cart.
    """
    await borrow_crud.clear_cart(engine, str(current_user.id))
    return {"status": "success"}
