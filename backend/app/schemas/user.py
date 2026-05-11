from datetime import datetime
from typing import Optional, Any, Annotated
from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from odmantic import ObjectId

# Helper to convert ObjectId to string
PyObjectId = Annotated[str, BeforeValidator(str)]

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Role(RoleBase):
    id: PyObjectId

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    tier: str = "standard"
    max_books_allowed: Optional[int] = None
    max_days_allowed: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    role_id: str

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    tier: Optional[str] = None
    max_books_allowed: Optional[int] = None
    max_days_allowed: Optional[int] = None
    is_active: Optional[bool] = None
    role_id: Optional[str] = None

class User(UserBase):
    id: PyObjectId
    role: Role
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
