

from typing import Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import log as log_schema
from app.crud import log as log_crud

router = APIRouter()

@router.post("", response_model=log_schema.CheckinLogResponse)
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

@router.get("/history", response_model=log_schema.CheckinLogHistoryResponse)
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
            check_time=log.check_time,
            checkout_time=log.checkout_time
        ))
    return log_schema.CheckinLogHistoryResponse(
        items=response,
        total=total,
        page=page,
        page_size=page_size
    )


# ===================== LIBRARIAN ENDPOINTS =====================

@router.get("/librarian/all", response_model=log_schema.CheckinLogListResponse)
async def list_checkin_logs(
    user_id: Optional[str] = None, check_type: Optional[str] = None,
    username: Optional[str] = None,
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """List all check-in logs for monitoring (Librarian/Admin only)."""
    dt_start = None
    dt_end = None
    if start_date:
        try:
            dt_start = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            pass
    if end_date:
        try:
            dt_end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            pass

    logs, total = await log_crud.get_all_checkin_logs(
        engine, user_id=user_id, check_type=check_type, username=username,
        start_date=dt_start, end_date=dt_end, page=page, page_size=page_size
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
            checkout_time=log.checkout_time,
            handled_by_name=handled_by_name
        ))
    return log_schema.CheckinLogListResponse(
        items=response,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/librarian/stats")
async def get_checkin_stats(
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Get today's check-in statistics for the dashboard cards."""
    from datetime import date as dt_date
    from odmantic import ObjectId as OID
    from app.models.log import CheckinLog
    today = dt_date.today()
    col = engine.get_collection(CheckinLog)
    from datetime import datetime
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    today_in = await col.count_documents({"check_type": {"$in": ["in", "check_in"]}, "check_time": {"$gte": today_start, "$lte": today_end}})
    # currently inside = check_type is 'in' and checkout_time is null and checked in today
    total_logs = await col.count_documents({})
    currently_in = await col.count_documents({"check_type": {"$in": ["in", "check_in"]}, "checkout_time": None, "check_time": {"$gte": today_start}})
    return {
        "currently_in_library": currently_in,
        "today_checkin": today_in,
        "total_logs": total_logs,
    }


@router.post("/librarian/manual", response_model=log_schema.CheckinLogListItem)
async def manual_checkin(
    log_in: log_schema.CheckinLogCreate,
    current_user: User = Depends(deps.get_current_librarian),
) -> Any:
    """Create a manual check-in/out log by librarian. Accepts user_id OR username."""
    try:
        # Support lookup by username if user_id looks like a username (not 24-char hex)
        user_id = log_in.user_id
        from odmantic import ObjectId
        import re
        if not re.match(r'^[0-9a-fA-F]{24}$', user_id):
            # Treat as username/student_code
            found_user = await engine.find_one(User, User.username == user_id)
            if not found_user:
                raise ValueError(f"User '{user_id}' not found")
            user_id = str(found_user.id)
        log = await log_crud.manual_checkin(
            engine, user_id=user_id, check_type=log_in.check_type,
            handled_by_id=str(current_user.id)
        )
        user = await engine.find_one(User, User.id == log.user.id)
        return log_schema.CheckinLogListItem(
            id=log.id, username=user.username if user else "Unknown",
            email=user.email if user else "", check_type=log.check_type,
            method=log.method, check_time=log.check_time,
            checkout_time=log.checkout_time,
            handled_by_name=current_user.username
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
