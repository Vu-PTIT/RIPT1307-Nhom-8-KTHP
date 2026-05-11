from typing import Optional
from odmantic import AIOEngine, ObjectId
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

async def get_user_by_email(engine: AIOEngine, email: str) -> Optional[User]:
    return await engine.find_one(User, User.email == email)

async def get_user_by_username(engine: AIOEngine, username: str) -> Optional[User]:
    return await engine.find_one(User, User.username == username)

async def create_user(engine: AIOEngine, user_in: UserCreate) -> User:
    # Check if role exists
    role = await engine.find_one(Role, Role.id == ObjectId(user_in.role_id))
    if not role:
        # Default role or error? For now, assume it exists or handle in API
        raise ValueError("Role not found")
        
    db_obj = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=role,
        tier=user_in.tier,
        max_books_allowed=user_in.max_books_allowed,
        max_days_allowed=user_in.max_days_allowed,
        is_active=user_in.is_active
    )
    await engine.save(db_obj)
    return db_obj
