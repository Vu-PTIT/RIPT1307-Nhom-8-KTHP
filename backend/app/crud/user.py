from datetime import datetime
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
        max_books_allowed=user_in.max_books_allowed,
        max_days_allowed=user_in.max_days_allowed,
        is_active=user_in.is_active
    )
    await engine.save(db_obj)
    return db_obj

async def get_all_users(
    engine: AIOEngine,
    role_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> tuple[list[User], int]:
    filters = []
    if role_id:
        filters.append(User.role == ObjectId(role_id))
    if is_active is not None:
        filters.append(User.is_active == is_active)
    
    if keyword:
        # Complex keyword search
        collection = engine.get_collection(User)
        mongo_query = {}
        if role_id: mongo_query["role"] = ObjectId(role_id)
        if is_active is not None: mongo_query["is_active"] = is_active
        mongo_query["$or"] = [
            {"username": {"$regex": keyword, "$options": "i"}},
            {"email": {"$regex": keyword, "$options": "i"}}
        ]
        total = await collection.count_documents(mongo_query)
        cursor = collection.find(mongo_query).skip((page - 1) * page_size).limit(page_size)
        raw_users = await cursor.to_list(length=page_size)
        users = [engine.database_to_model(User, u) for u in raw_users]
        return users, total
    
    total = await engine.count(User, *filters)
    users = await engine.find(
        User, *filters, 
        skip=(page - 1) * page_size, 
        limit=page_size,
        sort=User.username
    )
    return users, total

async def get_user_by_id(engine: AIOEngine, user_id: str) -> Optional[User]:
    return await engine.find_one(User, User.id == ObjectId(user_id))

async def update_user(engine: AIOEngine, user_id: str, user_in: dict) -> User:
    db_obj = await get_user_by_id(engine, user_id)
    if not db_obj:
        raise ValueError("User not found")
    
    if "role_id" in user_in:
        role = await engine.find_one(Role, Role.id == ObjectId(user_in.pop("role_id")))
        if role:
            db_obj.role = role
            
    if "password" in user_in:
        db_obj.password_hash = get_password_hash(user_in.pop("password"))
        
    for field, value in user_in.items():
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)
            
    db_obj.updated_at = datetime.utcnow()
    await engine.save(db_obj)
    return db_obj

async def toggle_user_active(engine: AIOEngine, user_id: str) -> User:
    db_obj = await get_user_by_id(engine, user_id)
    if not db_obj:
        raise ValueError("User not found")
    db_obj.is_active = not db_obj.is_active
    await engine.save(db_obj)
    return db_obj

async def delete_user(engine: AIOEngine, user_id: str) -> bool:
    db_obj = await get_user_by_id(engine, user_id)
    if not db_obj:
        return False
    # Check dependencies (borrow records) before deletion if necessary
    await engine.delete(db_obj)
    return True

async def count_users_by_role(engine: AIOEngine, role_name: str) -> int:
    role = await engine.find_one(Role, Role.name == role_name)
    if not role: return 0
    return await engine.count(User, User.role == role.id)
