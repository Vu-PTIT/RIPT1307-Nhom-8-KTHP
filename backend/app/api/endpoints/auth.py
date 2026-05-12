from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
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
        raise HTTPException(status_code=404, detail=str(e))
        
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
