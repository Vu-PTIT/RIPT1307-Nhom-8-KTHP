from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.db.session import engine
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemResponse

router = APIRouter()

@router.post("/", response_model=ItemResponse)
async def create_item(item_in: ItemCreate):
    item = Item(**item_in.model_dump())
    await engine.save(item)
    return item

@router.get("/", response_model=List[ItemResponse])
async def read_items():
    items = await engine.find(Item)
    return items

@router.get("/{id}", response_model=ItemResponse)
async def read_item(id: str):
    item = await engine.find_one(Item, Item.id == id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
