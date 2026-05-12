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
    filters = [CheckinLog.user == ObjectId(user_id)]
    total = await engine.count(CheckinLog, *filters)
    logs = await engine.find(
        CheckinLog, 
        *filters, 
        skip=(page - 1) * page_size, 
        limit=page_size,
        sort=CheckinLog.check_time.desc()
    )
    return logs, total
