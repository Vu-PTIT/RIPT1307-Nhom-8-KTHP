from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .user import User, PyObjectId

class CheckinLogBase(BaseModel):
    check_type: str
    method: str

class CheckinLogCreate(CheckinLogBase):
    user_id: str
    handled_by_id: Optional[str] = None

class CheckinLog(CheckinLogBase):
    id: PyObjectId
    user: User
    handled_by: Optional[User] = None
    check_time: datetime

    class Config:
        from_attributes = True

class CheckinLogResponse(CheckinLogBase):
    id: PyObjectId
    check_time: datetime
    handled_by_name: Optional[str] = None
