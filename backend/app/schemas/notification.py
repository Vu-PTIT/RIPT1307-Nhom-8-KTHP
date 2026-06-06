from pydantic import BaseModel
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str

class NotificationResponse(NotificationBase):
    id: str
    is_read: bool
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }
