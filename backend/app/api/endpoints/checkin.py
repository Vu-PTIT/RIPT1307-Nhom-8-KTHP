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
        handled_by_name = None
        if log.handled_by and str(log.handled_by.id) != str(current_user.id):
            # Fetch librarian name if handled by someone else
            librarian = await engine.find_one(User, User.id == log.handled_by.id)
            handled_by_name = librarian.username if librarian else "Librarian"
            
        response.append(log_schema.CheckinLogResponse(
            id=log.id,
            check_type=log.check_type,
            method=log.method,
            check_time=log.check_time,
            handled_by_name=handled_by_name
        ))
    return response
