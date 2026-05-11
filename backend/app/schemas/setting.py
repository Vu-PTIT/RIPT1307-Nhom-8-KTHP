from datetime import datetime
from typing import Optional, Annotated
from pydantic import BaseModel, BeforeValidator
from odmantic import ObjectId
from .user import User

# Helper to convert ObjectId to string
PyObjectId = Annotated[str, BeforeValidator(str)]

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
    id: PyObjectId
    updated_by_id: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
