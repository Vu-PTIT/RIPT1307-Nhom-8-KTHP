from __future__ import annotations
from typing import List, Tuple, Optional
from datetime import datetime
from odmantic import AIOEngine, ObjectId
from app.models.log import CheckinLog, get_local_now
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
    
    if check_type == "out":
        collection = engine.get_collection(CheckinLog)
        latest_raw = await collection.find_one(
            {"user": ObjectId(user_id)},
            sort=[("updated_at", -1), ("check_time", -1)]
        )
        if latest_raw and latest_raw.get("check_type") == "in" and latest_raw.get("checkout_time") is None:
            log = await engine.find_one(CheckinLog, CheckinLog.id == latest_raw["_id"])
            if log:
                log.checkout_time = get_local_now()
                log.updated_at = get_local_now()
                # Optional: update method or handled_by for the checkout? 
                await engine.save(log)
                return log

    db_obj = CheckinLog(
        user=user,
        check_type=check_type,
        method=method,
        handled_by=handled_by if handled_by else user,
        updated_at=get_local_now()
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
    total = await engine.count(CheckinLog, CheckinLog.user == ObjectId(user_id))
    logs = await engine.find(
        CheckinLog,
        CheckinLog.user == ObjectId(user_id),
        skip=skip,
        limit=page_size,
        sort=CheckinLog.updated_at.desc()
    )
    return list(logs), total


# ===================== LIBRARIAN OPERATIONS =====================

async def get_all_checkin_logs(
    engine: AIOEngine,
    user_id: Optional[str] = None,
    check_type: Optional[str] = None,
    username: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
) -> Tuple[List[CheckinLog], int]:
    """Get all check-in logs for monitoring."""
    conditions = []
    if user_id:
        conditions.append({"user": ObjectId(user_id)})
        
    if check_type:
        if check_type == 'in':
            # "Trong thư viện": active sessions from today only
            from datetime import datetime, date
            today_start = datetime.combine(date.today(), datetime.min.time())
            conditions.append({"check_type": {"$in": ["in", "check_in"]}, "checkout_time": None, "check_time": {"$gte": today_start}})
        elif check_type == 'out':
            # "Đã ra về": completed sessions OR standalone 'out' logs OR forgot to checkout from previous days
            from datetime import datetime, date
            today_start = datetime.combine(date.today(), datetime.min.time())
            conditions.append({"$or": [
                {"checkout_time": {"$ne": None}}, 
                {"check_type": {"$in": ["out", "check_out"]}},
                {"check_type": {"$in": ["in", "check_in"]}, "checkout_time": None, "check_time": {"$lt": today_start}}
            ]})
            
    if username:
        users_col = engine.get_collection(User)
        user_ids = await users_col.distinct("_id", {
            "$or": [
                {"username": {"$regex": username, "$options": "i"}},
                {"full_name": {"$regex": username, "$options": "i"}},
                {"email": {"$regex": username, "$options": "i"}}
            ]
        })
        if user_ids:
            conditions.append({"user": {"$in": user_ids}})
        else:
            return [], 0
            
    if start_date or end_date:
        time_cond = {}
        if start_date:
            time_cond["$gte"] = start_date
        if end_date:
            time_cond["$lte"] = end_date
        # Check either check_time or checkout_time depending on the condition, 
        # but for simplicity we can check updated_at or check_time
        conditions.append({"$or": [{"check_time": time_cond}, {"updated_at": time_cond}]})

    skip = (page - 1) * page_size
    collection = engine.get_collection(CheckinLog)
    if conditions:
        filter_expr = {"$and": conditions} if len(conditions) > 1 else conditions[0]
    else:
        filter_expr = {}

    raw_logs = await collection.find(filter_expr).sort("updated_at", -1).skip(skip).limit(page_size).to_list(length=None)
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
    
    if check_type == "out":
        collection = engine.get_collection(CheckinLog)
        latest_raw = await collection.find_one(
            {"user": ObjectId(user_id)},
            sort=[("updated_at", -1), ("check_time", -1)]
        )
        if latest_raw and latest_raw.get("check_type") == "in" and latest_raw.get("checkout_time") is None:
            log = await engine.find_one(CheckinLog, CheckinLog.id == latest_raw["_id"])
            if log:
                log.checkout_time = get_local_now()
                log.updated_at = get_local_now()
                await engine.save(log)
                return log
                
    log = CheckinLog(user=user, check_type=check_type, method="manual", handled_by=librarian, updated_at=get_local_now())
    await engine.save(log)
    return log
