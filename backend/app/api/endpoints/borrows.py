from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from odmantic import ObjectId
from app.db.session import engine
from app.api import deps
from app.models.document import Document, DocumentCopy
from app.models.user import User
from app.schemas import borrow as borrow_schema
from app.crud import borrow as borrow_crud

router = APIRouter()

def _resolve_reference_id(ref):
    return ref.id if hasattr(ref, "id") else ref

async def _get_borrow_detail_logic(record_id: str):
    """Internal helper to get borrow detail without role dependency check."""
    from app.models.borrow import BorrowRecord
    record = await engine.find_one(BorrowRecord, BorrowRecord.id == ObjectId(record_id))
    if not record:
        return None
        
    from app.crud.borrow import get_record_items
    items = await get_record_items(engine, record_id)
    
    item_summaries = []
    for item in items:
        copy_id = _resolve_reference_id(item.document_copy)
        copy = await engine.find_one(DocumentCopy, DocumentCopy.id == copy_id)
        doc_id = _resolve_reference_id(copy.document)
        doc = await engine.find_one(Document, Document.id == doc_id)
        
        status = "returned" if item.return_date else "borrowed"
        if not item.return_date and record.due_date < datetime.now().date():
            status = "overdue"
            
        item_summaries.append(borrow_schema.BorrowRecordItemSummary(
            id=item.id, copy_code=copy.copy_code, document_title=doc.title,
            borrow_date=record.borrow_date, due_date=record.due_date,
            return_date=item.return_date, status=status
        ))
        
    return borrow_schema.BorrowRecordDetailResponse(
        id=record.id, borrow_date=record.borrow_date, due_date=record.due_date,
        status=record.status, items=item_summaries
    )

@router.get("", response_model=List[borrow_schema.BorrowRecord])
async def get_my_borrows(
    status: Optional[str] = None,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """Get current user's borrow records."""
    try:
        return await borrow_crud.get_my_borrow_records(engine, str(current_user.id), status=status)
    except Exception as e:
        # Log the exception and return a readable error for debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.get("/{id}", response_model=borrow_schema.BorrowRecordDetailResponse)
async def get_borrow_detail(
    id: str,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """Get detailed information about a specific borrow record (Reader)."""
    # Check if this record belongs to the user
    from app.models.borrow import BorrowRecord
    record = await engine.find_one(
        BorrowRecord,
        (BorrowRecord.id == ObjectId(id)) & (BorrowRecord.reader == current_user.id)
    )
    if not record:
        raise HTTPException(status_code=404, detail="Borrow record not found or access denied")
    
    return await _get_borrow_detail_logic(id)

@router.put("/{id}", response_model=borrow_schema.BorrowRecord)
async def update_my_borrow_record(
    id: str,
    borrow_update: borrow_schema.BorrowRecordUpdate,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """Update notes on a borrow record belonging to the current user."""
    try:
        if borrow_update.notes is None:
            raise ValueError("Chỉ có thể cập nhật ghi chú")
        return await borrow_crud.update_borrow_record_notes(engine, id, str(current_user.id), borrow_update.notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}")
async def delete_my_borrow_record(
    id: str,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """Delete a returned borrow record from the user's history."""
    try:
        await borrow_crud.delete_borrow_record(engine, id, str(current_user.id))
        return {"message": "Borrow record deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===================== LIBRARIAN ENDPOINTS =====================

@router.post("/librarian", response_model=borrow_schema.BorrowRecordDetailResponse)
async def create_borrow_librarian(
    borrow_in: borrow_schema.LibrarianBorrowCreate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Create a new borrow record for a reader (Librarian action)."""
    try:
        record = await borrow_crud.create_borrow_record(
            engine, reader_id=borrow_in.reader_id, librarian_id=str(current_user.id),
            copy_codes=borrow_in.copy_codes, notes=borrow_in.notes
        )
        return await _get_borrow_detail_logic(str(record.id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/librarian/all", response_model=List[borrow_schema.BorrowRecordListItem])
async def list_borrow_records_librarian(
    status: Optional[str] = None, reader_id: Optional[str] = None,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """List all borrow records (Librarian view)."""
    records, total = await borrow_crud.get_all_borrow_records(
        engine, status=status, reader_id=reader_id, page=page, page_size=page_size
    )
    response = []
    from app.crud.borrow import get_record_items
    for rec in records:
        reader = await engine.find_one(User, User.id == rec.reader.id)
        items = await get_record_items(engine, str(rec.id))
        response.append(borrow_schema.BorrowRecordListItem(
            id=rec.id, reader_username=reader.username if reader else "Unknown",
            reader_email=reader.email if reader else "",
            borrow_date=rec.borrow_date, due_date=rec.due_date,
            status=rec.status, item_count=len(items), created_at=rec.created_at
        ))
    return response


@router.post("/librarian/return")
async def return_book_librarian(
    return_in: borrow_schema.LibrarianReturnRequest,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Process a book return by copy code."""
    try:
        item = await borrow_crud.process_return(
            engine, copy_code=return_in.copy_code, condition_on_return=return_in.condition_on_return
        )
        return {"message": "Success", "return_date": str(item.return_date)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
