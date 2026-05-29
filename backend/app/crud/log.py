from __future__ import annotations
from typing import List, Tuple, Optional
from odmantic import AIOEngine, ObjectId
from app.models.log import CheckinLog
from app.models.user import User

async def create_checkin_log(
    engine: AIOEngine, 
    user_id: str, 
    check_type: str, 
    method: str, 
    handled_by_id: Optional[str] = None
) -> CheckinLog:
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    if not user:
        raise ValueError("User not found")
        
    handled_by = None
    if handled_by_id:
        handled_by = await engine.find_one(User, User.id == ObjectId(handled_by_id))
    
    db_obj = CheckinLog(
        user=user,
        check_type=check_type,
        method=method,
        handled_by=handled_by if handled_by else user # Default to self if no librarian
    )
    await engine.save(db_obj)
    return db_obj

async def get_my_checkin_logs(
    engine: AIOEngine,
    user_id: str,
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[CheckinLog], int]:
    skip = (page - 1) * page_size
    # Dùng odmantic engine.find thay vì raw Motor query để khớp cách lưu Reference
    total = await engine.count(CheckinLog, CheckinLog.user == ObjectId(user_id))
    logs = await engine.find(
        CheckinLog,
        CheckinLog.user == ObjectId(user_id),
        skip=skip,
        limit=page_size,
        sort=CheckinLog.check_time.desc()
    )
    return list(logs), total


# ===================== LIBRARIAN OPERATIONS =====================

async def get_all_checkin_logs(
    engine: AIOEngine,
    user_id: Optional[str] = None,
    check_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
) -> Tuple[List[CheckinLog], int]:
    """Get all check-in logs for monitoring."""
    conditions = []
    if user_id:
        conditions.append({"user": ObjectId(user_id)})
    if check_type:
        conditions.append({"check_type": check_type})

    skip = (page - 1) * page_size
    collection = engine.get_collection(CheckinLog)
    if conditions:
        filter_expr = {"$and": conditions} if len(conditions) > 1 else conditions[0]
    else:
        filter_expr = {}

    raw_logs = await collection.find(filter_expr).sort("check_time", -1).skip(skip).limit(page_size).to_list(length=None)
    total = await collection.count_documents(filter_expr)
    logs: List[CheckinLog] = []
    for raw in raw_logs:
        log = await engine.find_one(CheckinLog, CheckinLog.id == raw["_id"])
        if log:
            logs.append(log)
    return logs, total


async def manual_checkin(
    engine: AIOEngine,
    user_id: str,
    check_type: str,
    handled_by_id: str,
) -> CheckinLog:
    """Create a manual check-in log by librarian."""
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    if not user: raise ValueError("User not found")
    librarian = await engine.find_one(User, User.id == ObjectId(handled_by_id))
    log = CheckinLog(user=user, check_type=check_type, method="manual", handled_by=librarian)
    await engine.save(log)
    return log

