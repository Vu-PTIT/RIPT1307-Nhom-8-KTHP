from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import log as log_schema
from app.crud import log as log_crud

router = APIRouter()

@router.post("/", response_model=log_schema.CheckinLogResponse)
async def checkin_checkout(
    log_in: log_schema.CheckinLogBase,
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Log a self check-in or check-out.
    """
    try:
        log = await log_crud.create_checkin_log(
            engine, 
            user_id=str(current_user.id),
            check_type=log_in.check_type,
            method=log_in.method
        )
        return log_schema.CheckinLogResponse(
            id=log.id,
            check_type=log.check_type,
            method=log.method,
            check_time=log.check_time
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history", response_model=List[log_schema.CheckinLogResponse])
async def get_checkin_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(deps.get_current_reader)
) -> Any:
    """
    Get user's check-in/check-out history.
    """
    logs, total = await log_crud.get_my_checkin_logs(
        engine, user_id=str(current_user.id), page=page, page_size=page_size
    )
    
    response = []
    for log in logs:
        response.append(log_schema.CheckinLogResponse(
            id=log.id,
            check_type=log.check_type,
            method=log.method,
            check_time=log.check_time
        ))
    return response


# ===================== LIBRARIAN ENDPOINTS =====================

@router.get("/librarian/all", response_model=List[log_schema.CheckinLogListItem], tags=["librarian"])
async def list_checkin_logs(
    user_id: Optional[str] = None, check_type: Optional[str] = None,
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """List all check-in logs for monitoring (Librarian/Admin only)."""
    logs, total = await log_crud.get_all_checkin_logs(
        engine, user_id=user_id, check_type=check_type, page=page, page_size=page_size
    )
    response = []
    for log in logs:
        user = await engine.find_one(User, User.id == log.user.id)
        handled_by_name = None
        if log.handled_by:
            handler = await engine.find_one(User, User.id == log.handled_by.id)
            handled_by_name = handler.username if handler else None

        response.append(log_schema.CheckinLogListItem(
            id=log.id, username=user.username if user else "Unknown",
            email=user.email if user else "", check_type=log.check_type,
            method=log.method, check_time=log.check_time,
            handled_by_name=handled_by_name
        ))
    return response


@router.post("/librarian/manual", response_model=log_schema.CheckinLogListItem, tags=["librarian"])
async def manual_checkin(
    log_in: log_schema.CheckinLogCreate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Create a manual check-in log by librarian."""
    try:
        log = await log_crud.manual_checkin(
            engine, user_id=log_in.user_id, check_type=log_in.check_type,
            handled_by_id=str(current_user.id)
        )
        user = await engine.find_one(User, User.id == log.user.id)
        return log_schema.CheckinLogListItem(
            id=log.id, username=user.username if user else "Unknown",
            email=user.email if user else "", check_type=log.check_type,
            method=log.method, check_time=log.check_time,
            handled_by_name=current_user.username
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
