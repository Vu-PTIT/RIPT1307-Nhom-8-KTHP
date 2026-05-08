from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .user import User

class LibrarySettingBase(BaseModel):
    setting_key: str
    setting_value: str
    description: str

class LibrarySettingCreate(LibrarySettingBase):
    pass

class LibrarySettingUpdate(BaseModel):
    setting_value: Optional[str] = None
    description: Optional[str] = None

class LibrarySetting(LibrarySettingBase):
    id: str
    updated_by: User
    updated_at: datetime

    class Config:
        from_attributes = True
