from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from odmantic import ObjectId

from app.core.config import settings
from app.db.session import engine
from app.models.user import Role, User
from app.schemas.token import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    # Using fetch_links=True to load the Role reference
    user = await engine.find_one(User, User.id == ObjectId(token_data.sub))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def _normalize_role_name(role) -> str:
    if not role:
        return ''
    if hasattr(role, 'name'):
        return str(role.name).lower().strip()
    return str(role).lower().strip()

async def get_current_active_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    # Need to check if role is loaded. Odmantic references are proxies.
    # We should ensure the role name is accessible.
    role_id = current_user.role.id if hasattr(current_user.role, "id") else current_user.role
    role = await engine.find_one(Role, Role.id == role_id)
    if not role or _normalize_role_name(role.name) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_librarian(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Allow both Librarian and Admin roles to access librarian features."""
    role_id = current_user.role.id if hasattr(current_user.role, "id") else current_user.role
    role = await engine.find_one(Role, Role.id == role_id)
    if not role or _normalize_role_name(role.name) not in ("librarian", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="This action is for librarians only"
        )
    return current_user

async def get_current_reader(
    current_user: User = Depends(get_current_active_user),
) -> User:
    role_id = current_user.role.id if hasattr(current_user.role, "id") else current_user.role
    role = await engine.find_one(Role, Role.id == role_id)
    if not role or _normalize_role_name(role.name) not in ("member", "reader", "librarian", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="This action is for readers only"
        )
    return current_user
