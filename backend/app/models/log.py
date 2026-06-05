from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from odmantic import Model, Field, Reference
from .user import User

def get_local_now():
    # Return timezone-aware UTC datetime so PyMongo stores it properly and frontend gets the Z
    return datetime.now(timezone.utc)

class CheckinLog(Model):
    user: User = Reference()
    check_type: str
    method: str
    handled_by: User = Reference()
    check_time: datetime = Field(default_factory=get_local_now)
    checkout_time: datetime | None = None
    updated_at: Optional[datetime] = None

    model_config = {
        "collection": "checkin_logs"
    }
