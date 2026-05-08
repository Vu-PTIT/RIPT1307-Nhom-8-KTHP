from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

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
    id: str

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    tier: str = "standard"
    max_books_allowed: int = 5
    max_days_allowed: int = 14
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    role_id: str

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
    id: str
    role: Role
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
