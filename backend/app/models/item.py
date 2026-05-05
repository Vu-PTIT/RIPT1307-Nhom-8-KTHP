from datetime import datetime
from typing import Optional
from odmantic import Model, Field

class Item(Model):
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
