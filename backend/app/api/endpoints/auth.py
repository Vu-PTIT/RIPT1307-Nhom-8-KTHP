from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
import io
from bson import ObjectId
from app.db.session import engine
from app.core import security
from app.core.config import settings
from app.schemas import user as user_schema
from app.schemas import token as token_schema
from app.crud import user as user_crud
from app.models.user import Role

router = APIRouter()

@router.post("/register", response_model=user_schema.User)
async def register(user_in: user_schema.UserRegister) -> Any:
    """
    Register a new user.
    """
    user = await user_crud.get_user_by_email(engine, user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user = await user_crud.get_user_by_username(engine, user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    
    # Get default "Member" role
    role = await engine.find_one(Role, Role.name == "Member")
    if not role:
        # Fallback if roles weren't initialized
        raise HTTPException(
            status_code=500,
            detail="Default role 'Member' not found. Please contact administrator.",
        )
    
    # Create UserCreate object with defaults
    user_create = user_schema.UserCreate(
        username=user_in.username,
        email=user_in.email,
        password=user_in.password,
        role_id=str(role.id),
        max_books_allowed=None,
        max_days_allowed=None,
        is_active=True
    )
    
    try:
        user = await user_crud.create_user(engine, user_create)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    return user

@router.post("/login", response_model=token_schema.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await user_crud.get_user_by_username(engine, form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/roles")
async def get_roles() -> Any:
    """
    Get all available roles.
    """
    roles = await engine.find(Role)
    return roles

from app.api import deps
@router.get("/me", response_model=user_schema.User)
async def read_user_me(
    current_user: user_schema.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=user_schema.User)
async def update_user_me(
    user_in: user_schema.UserUpdate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update current user profile.
    """
    update_data = user_in.model_dump(exclude_unset=True)
    updated_user = await user_crud.update_user(engine, str(current_user.id), update_data)
    return updated_user


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: user_schema.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload an avatar image and store it in GridFS. Saves the file id string into User.avatar.
    """
    # get DB and GridFS bucket
    db_name = engine.database_name
    db = engine.client[db_name]
    from motor.motor_asyncio import AsyncIOMotorGridFSBucket
    bucket = AsyncIOMotorGridFSBucket(db)

    # read file bytes
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    # upload to gridfs
    try:
        file_id = await bucket.upload_from_stream(file.filename or "avatar", contents, metadata={"contentType": file.content_type})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store file: {e}")

    # update user record
    user = await user_crud.get_user_by_id(engine, str(current_user.id))
    if not user:
        try:
            await bucket.delete(file_id)
        except Exception:
            pass
        raise HTTPException(status_code=404, detail="User not found")

    # If user already had an avatar, delete the old one
    if user.avatar:
        try:
            await bucket.delete(ObjectId(user.avatar))
        except Exception:
            pass

    user.avatar = str(file_id)
    await engine.save(user)
    return {"file_id": str(file_id), "avatar": user.avatar}


@router.get("/avatars/{file_id}")
async def serve_avatar(file_id: str) -> Any:
    """Stream an avatar image previously stored in GridFS by id."""
    db_name = engine.database_name
    db = engine.client[db_name]
    from motor.motor_asyncio import AsyncIOMotorGridFSBucket
    bucket = AsyncIOMotorGridFSBucket(db)

    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file id")

    try:
        grid_out = await bucket.open_download_stream(oid)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

    data = await grid_out.read()
    content_type = None
    try:
        md = grid_out.metadata or {}
        content_type = md.get("contentType")
    except Exception:
        content_type = None

    return StreamingResponse(io.BytesIO(data), media_type=content_type or "application/octet-stream")
