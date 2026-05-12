from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import borrow as borrow_schema
from app.crud import borrow as borrow_crud

router = APIRouter()

@router.get("/", response_model=List[borrow_schema.BorrowRecord])
async def get_my_borrows(
    status: Optional[str] = None,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Get current user's borrow records.
    """
    return await borrow_crud.get_my_borrow_records(engine, str(current_user.id), status=status)

@router.get("/{id}", response_model=borrow_schema.BorrowRecordDetailResponse)
async def get_borrow_detail(
    id: str,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Get detailed information about a specific borrow record.
    """
    record = await borrow_crud.get_borrow_record_detail(engine, id, str(current_user.id))
    if not record:
        raise HTTPException(status_code=404, detail="Borrow record not found")
        
    items = await borrow_crud.get_record_items(engine, id)
    
    item_summaries = []
    for item in items:
        # Load copy and document
        copy = await engine.find_one(item.document_copy.model, item.document_copy.model.id == item.document_copy.id)
        doc = await engine.find_one(copy.document.model, copy.document.model.id == copy.document.id)
        
        status = "returned" if item.return_date else "borrowed"
        if not item.return_date and record.due_date < datetime.now().date():
            status = "overdue"
            
        item_summaries.append(borrow_schema.BorrowRecordItemSummary(
            id=item.id,
            copy_code=copy.copy_code,
            document_title=doc.title,
            borrow_date=record.borrow_date,
            due_date=record.due_date,
            return_date=item.return_date,
            status=status
        ))
        
    return borrow_schema.BorrowRecordDetailResponse(
        id=record.id,
        borrow_date=record.borrow_date,
        due_date=record.due_date,
        status=record.status,
        items=item_summaries
    )
