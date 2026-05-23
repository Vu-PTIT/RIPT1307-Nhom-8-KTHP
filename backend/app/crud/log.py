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
    collection = engine.get_collection(CheckinLog)
    query = {"user": ObjectId(user_id)}
    total = await collection.count_documents(query)
    raw = await collection.find(query).sort("check_time", -1).skip((page - 1) * page_size).limit(page_size).to_list(length=page_size)
    logs = [engine.database_to_model(CheckinLog, doc) for doc in raw]
    return logs, total


# ===================== LIBRARIAN OPERATIONS =====================

async def get_all_checkin_logs(
    engine: AIOEngine,
    user_id: Optional[str] = None,
    check_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
) -> Tuple[List[CheckinLog], int]:
    """Get all check-in logs for monitoring."""
    collection = engine.get_collection(CheckinLog)
    query = {}
    if user_id:
        query["user"] = ObjectId(user_id)
    if check_type:
        query["check_type"] = check_type
    
    total = await collection.count_documents(query)
    raw = await collection.find(query).sort("check_time", -1).skip((page - 1) * page_size).limit(page_size).to_list(length=page_size)
    logs = [engine.database_to_model(CheckinLog, doc) for doc in raw]
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

