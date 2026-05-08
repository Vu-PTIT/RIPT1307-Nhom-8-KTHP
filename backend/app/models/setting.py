from __future__ import annotations
from datetime import datetime
from odmantic import Model, Field, Reference
from .user import User

class LibrarySetting(Model):
    setting_key: str = Field(unique=True)
    setting_value: str
    description: str
    updated_by: User = Reference()
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "library_settings"
    }
