from __future__ import annotations
from datetime import datetime
from odmantic import Model, Field, Reference
from .user import User

class CheckinLog(Model):
    user: User = Reference()
    check_type: str
    method: str
    handled_by: User = Reference()
    check_time: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "checkin_logs"
    }
