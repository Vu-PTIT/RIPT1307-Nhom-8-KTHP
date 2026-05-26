from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from odmantic import ObjectId
from app.db.session import engine
from app.api import deps
from app.models.borrow import BorrowRecordItem, BorrowRecord
from app.models.document import Document, DocumentCopy
from app.models.user import User
from app.schemas import borrow as borrow_schema
from app.crud import borrow as borrow_crud

router = APIRouter()

def _resolve_reference_id(ref):
    return ref.id if hasattr(ref, "id") else ref

async def _build_renewal_response(renewal):
    item_id = _resolve_reference_id(renewal.borrow_record_item)
    item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == item_id)
    if not item:
        raise HTTPException(status_code=400, detail="Borrow record item not found")

    record_id = _resolve_reference_id(item.borrow_record)
    record = await engine.find_one(BorrowRecord, BorrowRecord.id == record_id)
    if not record:
        raise HTTPException(status_code=400, detail="Borrow record not found")

    copy_id = _resolve_reference_id(item.document_copy)
    copy = await engine.find_one(DocumentCopy, DocumentCopy.id == copy_id)
    if not copy:
        raise HTTPException(status_code=400, detail="Document copy not found")

    doc_id = _resolve_reference_id(copy.document)
    doc = await engine.find_one(Document, Document.id == doc_id)
    if not doc:
        raise HTTPException(status_code=400, detail="Document not found")

    return borrow_schema.RenewalRequestResponse(
        id=renewal.id,
        borrow_record_item_id=str(item.id),
        document_title=doc.title,
        old_due_date=record.due_date,
        new_due_date=renewal.new_due_date,
        status=renewal.status,
        request_date=renewal.request_date,
        reject_reason=renewal.reject_reason,
    )

@router.post("", response_model=borrow_schema.RenewalRequestResponse)
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
        return await _build_renewal_response(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[borrow_schema.RenewalRequestResponse])
async def get_my_renewals(
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Get all renewal requests sent by the current user.
    """
    requests = await borrow_crud.get_my_renewals(engine, str(current_user.id))
    response = [await _build_renewal_response(req) for req in requests]
    return response

@router.put("/{id}", response_model=borrow_schema.RenewalRequestResponse)
async def modify_renewal_request(
    id: str,
    renewal_in: borrow_schema.RenewalRequestModify,
    current_user: User = Depends(deps.get_current_reader),
) -> Any:
    """Modify an existing pending renewal request."""
    try:
        renewal = await borrow_crud.update_renewal_request(engine, id, str(current_user.id), renewal_in.new_due_date)
        return await _build_renewal_response(renewal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}", response_model=borrow_schema.RenewalRequestResponse)
async def cancel_renewal_request(
    id: str,
    current_user: User = Depends(deps.get_current_reader),
) -> Any:
    """Cancel a pending renewal request."""
    try:
        renewal = await borrow_crud.cancel_renewal_request(engine, id, str(current_user.id))
        return await _build_renewal_response(renewal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===================== LIBRARIAN ENDPOINTS =====================

@router.get("/librarian/pending", response_model=List[borrow_schema.RenewalRequestResponse])
async def list_pending_renewals(
    status: str = Query("pending"),
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """List renewal requests (default: pending)."""
    requests = await borrow_crud.get_pending_renewals(engine, status_filter=status)
    response = []
    for req in requests:
        item_id = _resolve_reference_id(req.borrow_record_item)
        item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == item_id)
        record_id = _resolve_reference_id(item.borrow_record)
        record = await engine.find_one(BorrowRecord, BorrowRecord.id == record_id)
        copy_id = _resolve_reference_id(item.document_copy)
        copy = await engine.find_one(DocumentCopy, DocumentCopy.id == copy_id)
        doc_id = _resolve_reference_id(copy.document)
        doc = await engine.find_one(Document, Document.id == doc_id)
        response.append(borrow_schema.RenewalRequestResponse(
            id=req.id,
            borrow_record_item_id=str(item.id),
            document_title=doc.title,
            old_due_date=record.due_date,
            new_due_date=req.new_due_date,
            status=req.status,
            request_date=req.request_date,
            reject_reason=req.reject_reason
        ))
    return response


@router.put("/librarian/{id}", response_model=borrow_schema.RenewalRequestResponse)
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
        
        # Load related data for response
        from app.models.borrow import BorrowRecordItem, BorrowRecord
        from app.models.document import Document, DocumentCopy
        
        item_id = _resolve_reference_id(renewal.borrow_record_item)
        item = await engine.find_one(BorrowRecordItem, BorrowRecordItem.id == item_id)
        record_id = _resolve_reference_id(item.borrow_record)
        record = await engine.find_one(BorrowRecord, BorrowRecord.id == record_id)
        copy_id = _resolve_reference_id(item.document_copy)
        copy = await engine.find_one(DocumentCopy, DocumentCopy.id == copy_id)
        doc_id = _resolve_reference_id(copy.document)
        doc = await engine.find_one(Document, Document.id == doc_id)
        
        return borrow_schema.RenewalRequestResponse(
            id=renewal.id,
            document_title=doc.title,
            old_due_date=record.due_date,
            new_due_date=renewal.new_due_date,
            status=renewal.status,
            request_date=renewal.request_date,
            reject_reason=renewal.reject_reason
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

