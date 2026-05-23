import sys
import os
from pymongo import MongoClient
from passlib.context import CryptContext

# Set up passlib context (matching backend/app/core/security.py)
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_password_truncated = plain_password[:72]
        return pwd_context.verify(plain_password_truncated, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

# MongoDB connection
client = MongoClient("mongodb://localhost:27017")
db = client["app_db"]
users_collection = db["users"]

def check_user(username, password):
    user = users_collection.find_one({"username": username})
    if user:
        username_val = user.get("username")
        email_val = user.get("email")
        pwd_hash = user.get("password_hash")
        is_valid = verify_password(password, pwd_hash)
        print(f"User: {username_val}")
        print(f"Email: {email_val}")
        print(f"Password Hash (first 20 chars): {pwd_hash[:20]}")
        print(f"Verify '{password}': {is_valid}")
        print("-" * 20)
    else:
        print(f"User '{username}' not found.")
        print("-" * 20)

check_user('test123', '123456')
check_user('admin', 'admin123')

client.close()
