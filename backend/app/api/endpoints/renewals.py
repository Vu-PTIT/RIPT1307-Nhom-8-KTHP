from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import borrow as borrow_schema
from app.crud import borrow as borrow_crud

router = APIRouter()

@router.post("/", response_model=borrow_schema.RenewalRequestResponse)
async def request_renewal(
    renewal_in: borrow_schema.RenewalRequestCreate,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Request a renewal for a borrowed item.
    """
    try:
        request = await borrow_crud.create_renewal_request(
            engine, 
            renewal_in.borrow_record_item_id, 
            str(current_user.id), 
            renewal_in.new_due_date
        )
        
        # Load related data for response
        item = await engine.find_one(request.borrow_record_item.model, request.borrow_record_item.model.id == request.borrow_record_item.id)
        record = await engine.find_one(item.borrow_record.model, item.borrow_record.model.id == item.borrow_record.id)
        copy = await engine.find_one(item.document_copy.model, item.document_copy.model.id == item.document_copy.id)
        doc = await engine.find_one(copy.document.model, copy.document.model.id == copy.document.id)
        
        return borrow_schema.RenewalRequestResponse(
            id=request.id,
            document_title=doc.title,
            old_due_date=record.due_date,
            new_due_date=request.new_due_date,
            status=request.status,
            request_date=request.request_date
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[borrow_schema.RenewalRequestResponse])
async def get_my_renewals(
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Get all renewal requests sent by the current user.
    """
    requests = await borrow_crud.get_my_renewals(engine, str(current_user.id))
    
    response = []
    for req in requests:
        item = await engine.find_one(req.borrow_record_item.model, req.borrow_record_item.model.id == req.borrow_record_item.id)
        record = await engine.find_one(item.borrow_record.model, item.borrow_record.model.id == item.borrow_record.id)
        copy = await engine.find_one(item.document_copy.model, item.document_copy.model.id == item.document_copy.id)
        doc = await engine.find_one(copy.document.model, copy.document.model.id == copy.document.id)
        
        response.append(borrow_schema.RenewalRequestResponse(
            id=req.id,
            document_title=doc.title,
            old_due_date=record.due_date,
            new_due_date=req.new_due_date,
            status=req.status,
            request_date=req.request_date,
            reject_reason=req.reject_reason
        ))
    return response


# ===================== LIBRARIAN ENDPOINTS =====================

@router.get("/librarian/pending", response_model=List[borrow_schema.RenewalRequestResponse], tags=["librarian"])
async def list_pending_renewals(
    status: str = Query("pending"),
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """List renewal requests (default: pending)."""
    requests = await borrow_crud.get_pending_renewals(engine, status_filter=status)
    response = []
    from app.models.borrow import BorrowRecordItem, BorrowRecord
    from app.models.document import Document, DocumentCopy
    for req in requests:
        item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == req.borrow_record_item.id)
        record = await engine.find_one(BorrowRecord, BorrowRecord.id == item.borrow_record.id)
        copy = await engine.find_one(DocumentCopy, DocumentCopy.id == item.document_copy.id)
        doc = await engine.find_one(Document, Document.id == copy.document.id)
        response.append(borrow_schema.RenewalRequestResponse(
            id=req.id, document_title=doc.title, old_due_date=record.due_date,
            new_due_date=req.new_due_date, status=req.status,
            request_date=req.request_date, reject_reason=req.reject_reason
        ))
    return response


@router.put("/librarian/{id}", response_model=borrow_schema.RenewalRequestResponse, tags=["librarian"])
async def review_renewal(
    id: str, review_in: borrow_schema.RenewalReviewRequest,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Approve or reject a renewal request."""
    try:
        renewal = await borrow_crud.review_renewal(
            engine, renewal_id=id, librarian_id=str(current_user.id),
            new_status=review_in.status, reject_reason=review_in.reject_reason
        )
        return await list_pending_renewals(status=renewal.status, current_user=current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

