from __future__ import annotations
from datetime import datetime
from typing import Optional
from odmantic import Model, Field, Reference

class Role(Model):
    name: str
    description: str | None = Field(default=None)

    model_config = {
        "collection": "roles"
    }

class User(Model):
    role: Role = Reference()
    username: str = Field(unique=True)
    email: str = Field(unique=True)
    password_hash: str
    tier: str = Field(default="standard")
    max_books_allowed: int | None = Field(default=None)
    max_days_allowed: int | None = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "collection": "users"
    }
