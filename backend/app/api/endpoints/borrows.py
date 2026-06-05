from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import borrow as borrow_schema
from app.crud import borrow as borrow_crud

router = APIRouter()


def _as_date(value):
    return value.date() if isinstance(value, datetime) else value

async def _get_borrow_detail_logic(record_id: str):
    """Internal helper to get borrow detail without role dependency check. Uses raw Mongo queries to prevent ODMantic validation errors."""
    from app.models.borrow import BorrowRecord, BorrowRecordItem
    from app.models.document import Document, DocumentCopy
    from odmantic import ObjectId
    from app.crud.borrow import get_record_items_dict

    collection = engine.get_collection(BorrowRecord)
    record = await collection.find_one({"_id": ObjectId(record_id)})
    if not record:
        return None
        
    items = await get_record_items_dict(engine, record_id)
    
    item_summaries = []
    for item in items:
        copy_ref = item.get("document_copy")
        copy = await engine.find_one(DocumentCopy, DocumentCopy.id == copy_ref) if copy_ref else None
        doc = await engine.find_one(Document, Document.id == copy.document.id) if copy else None
        if not copy or not doc:
            continue
        
        item_due_date = item.get("due_date") or record.get("due_date")
        status = "returned" if item.get("return_date") else "borrowed"
        if not item.get("return_date") and item_due_date and _as_date(item_due_date) < datetime.now().date():
            status = "overdue"
            
        item_summaries.append(borrow_schema.BorrowRecordItemSummary(
            id=item["_id"], copy_code=copy.copy_code, document_title=doc.title,
            author=doc.author, cover_image=doc.cover_image,
            borrow_date=_as_date(record.get("borrow_date")), due_date=_as_date(item_due_date),
            return_date=_as_date(item.get("return_date")) if item.get("return_date") else None, status=status
        ))
        
    return borrow_schema.BorrowRecordDetailResponse(
        id=record["_id"], borrow_date=_as_date(record.get("borrow_date")), due_date=_as_date(record.get("due_date")),
        status=record.get("status", "borrowed"), items=item_summaries
    )

@router.get("", response_model=List[borrow_schema.BorrowRecordSummaryResponse])
async def get_my_borrows(
    status: Optional[str] = None,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """Get current user's borrow records."""
    records = await borrow_crud.get_my_borrow_records(engine, str(current_user.id), status=status)
    return [
        borrow_schema.BorrowRecordSummaryResponse(
            id=record.id,
            borrow_date=_as_date(record.borrow_date),
            due_date=_as_date(record.due_date),
            status=record.status,
            notes=record.notes,
        )
        for record in records
    ]

@router.post("/checkout", response_model=borrow_schema.BorrowRecordDetailResponse)
async def checkout_cart(
    current_user: User = Depends(deps.get_current_reader),
) -> Any:
    """Checkout current user's borrow cart and create a borrow record."""
    try:
        record = await borrow_crud.create_borrow_from_cart(engine, str(current_user.id))
        return await _get_borrow_detail_logic(str(record.id))
    except ValueError as e:
        detail = e.args[0] if e.args else str(e)
        raise HTTPException(status_code=400, detail=detail)


@router.get("/count")
async def get_current_borrow_count(
    current_user: User = Depends(deps.get_current_reader),
) -> Any:
    """Return the number of currently borrowed (not returned) items for the current user."""
    from app.crud.borrow import count_current_borrowed
    count = await count_current_borrowed(engine, str(current_user.id))
    return {"current_borrowed": count}


# ===================== LIBRARIAN ENDPOINTS =====================
# Phải đặt TRƯỜC route /{id} để FastAPI khộng nhầm lẵn path cụ thể với param động

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
        detail = e.args[0] if e.args else str(e)
        raise HTTPException(status_code=400, detail=detail)


@router.get("/librarian/all", response_model=List[borrow_schema.BorrowRecordListItem])
async def list_borrow_records_librarian(
    response: Response,
    status: Optional[str] = None, reader_id: Optional[str] = None,
    username: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """List all borrow records (Librarian view)."""
    records, total = await borrow_crud.get_all_borrow_records(
        engine, status=status, reader_id=reader_id, username=username,
        start_date=start_date, end_date=end_date, page=page, page_size=page_size
    )
    response.headers["x-total-count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "x-total-count"
    response = []
    from app.crud.borrow import get_record_items_dict
    from app.models.document import DocumentCopy, Document
    for rec in records:
        rec_id = rec["_id"]
        reader_ref = rec.get("reader")
        reader = None
        if reader_ref:
            reader = await engine.find_one(User, User.id == reader_ref)
            
        items = await get_record_items_dict(engine, str(rec_id))
        
        copy_codes = []
        item_details = []
        for item in items:
            copy_ref = item.get("document_copy")
            copy = await engine.find_one(DocumentCopy, DocumentCopy.id == copy_ref) if copy_ref else None
            if copy:
                copy_codes.append(copy.copy_code)
                doc = await engine.find_one(Document, Document.id == copy.document.id) if copy.document else None
                cat_name = "Unknown"
                if doc and getattr(doc, 'category', None):
                    from app.models.document import Category
                    cat = await engine.find_one(Category, Category.id == doc.category.id)
                    if cat:
                        cat_name = cat.name
                item_details.append({
                    "copy_code": copy.copy_code,
                    "document_title": doc.title if doc else "Unknown",
                    "cover_image": doc.cover_image if doc else None,
                    "author": doc.author if doc else "",
                    "category_name": cat_name
                })

        response.append(borrow_schema.BorrowRecordListItem(
            id=rec_id, reader_username=reader.username if reader else "Unknown",
            reader_email=reader.email if reader else "",
            reader_avatar=reader.avatar if reader and hasattr(reader, 'avatar') else None,
            borrow_date=_as_date(rec.get("borrow_date")), due_date=_as_date(rec.get("due_date")),
            status=rec.get("status", "borrowed"), item_count=len(items), copy_codes=copy_codes,
            items=item_details,
            created_at=rec.get("created_at")
        ))
    return response

@router.get("/librarian/returns/history", response_model=borrow_schema.ReturnHistoryResponse)
async def get_return_history_librarian(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Get history of returned books."""
    records, total = await borrow_crud.get_return_history(engine, page=page, page_size=page_size)
    items = []
    for rec in records:
        items.append(borrow_schema.ReturnHistoryItem(**rec))
    return borrow_schema.ReturnHistoryResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/librarian/{id}", response_model=borrow_schema.BorrowRecordDetailResponse)
async def get_borrow_detail_librarian(
    id: str,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Get detailed information about a specific borrow record (Librarian)."""
    detail = await _get_borrow_detail_logic(id)
    if not detail:
        raise HTTPException(status_code=404, detail="Borrow record not found")
    return detail

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


@router.put("/librarian/{id}/confirm")
async def confirm_reservation_librarian(
    id: str,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Confirm handover of reserved books. Changes status from pending to borrowed."""
    try:
        record = await borrow_crud.confirm_borrow_handover(engine, id, str(current_user.id))
        return {"message": "Success", "status": record.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/librarian/{id}/cancel")
async def cancel_reservation_librarian(
    id: str,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Cancel a pending reservation. Copies return to available."""
    try:
        record = await borrow_crud.cancel_borrow_reservation(engine, id)
        return {"message": "Success", "status": record.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===================== USER ENDPOINT (DYNAMIC) =====================
# Route /{id} phải đặt SAU tất cả các route cụ thể khác

@router.get("/{id}", response_model=borrow_schema.BorrowRecordDetailResponse)
async def get_borrow_detail(
    id: str,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """Get detailed information about a specific borrow record (Reader)."""
    from app.models.borrow import BorrowRecord
    from odmantic import ObjectId

    # Dùng odmantic thay vì raw Motor query để khớp Reference
    record = await engine.find_one(
        BorrowRecord,
        (BorrowRecord.id == ObjectId(id)) & (BorrowRecord.reader == ObjectId(str(current_user.id)))
    )
    if not record:
        raise HTTPException(status_code=404, detail="Borrow record not found or access denied")
    
    return await _get_borrow_detail_logic(id)

