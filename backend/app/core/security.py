import bcrypt
# Monkeypatch bcrypt for passlib compatibility
if not hasattr(bcrypt, "__about__"):
    class About:
        __version__ = getattr(bcrypt, "__version__", "4.0.1")
    bcrypt.__about__ = About()

from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Use pbkdf2_sha256 for new hashes so passwords longer than 72 bytes do not fail.
# Keep bcrypt enabled so existing stored hashes can still be verified.
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Truncate plain_password to 72 bytes for bcrypt compatibility
        plain_password_truncated = plain_password[:72]
        return pwd_context.verify(plain_password_truncated, hashed_password)
    except Exception as e:
        # Log and return False on any password verification error
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    # Truncate password to 72 bytes for bcrypt compatibility
    password_truncated = password[:72]
    return pwd_context.hash(password_truncated)
