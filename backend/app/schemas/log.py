from datetime import datetime
from pydantic import BaseModel
from .user import User

class CheckinLogBase(BaseModel):
    check_type: str
    method: str

class CheckinLogCreate(CheckinLogBase):
    user_id: str
    handled_by_id: str

class CheckinLog(CheckinLogBase):
    id: str
    user: User
    handled_by: User
    check_time: datetime

    class Config:
        from_attributes = True
