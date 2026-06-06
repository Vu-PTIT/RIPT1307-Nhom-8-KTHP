from __future__ import annotations
from datetime import datetime
from odmantic import Model, Field, Reference
from .user import User

class Notification(Model):
    user: User = Reference()
    title: str
    message: str
    type: str
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "notifications"
    }
