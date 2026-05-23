import asyncio
import sys
import os

# Add current directory to sys.path to import app
sys.path.append(os.getcwd())

from app.db.session import engine
from app.core.security import get_password_hash
from app.models.user import Role, User
from app.models.document import Category, Document, DocumentCopy
from app.models.borrow import Wishlist, BorrowCartItem, BorrowRecord, BorrowRecordItem, RenewalRequest
from app.models.setting import LibrarySetting
from app.models.log import CheckinLog

async def init_db():
    print("--- Database Initialization ---")
    db_name = engine.database_name
    print(f"Connecting to database: {db_name}")
    
    # Get the underlying motor database object
    db = engine.client[db_name]
    
    # List of models to ensure collections exist
    models = [
        Role, User, Category, Document, DocumentCopy, 
        Wishlist, BorrowCartItem, BorrowRecord, BorrowRecordItem, 
        RenewalRequest, LibrarySetting, CheckinLog
    ]
    
    try:
        # Get existing collections
        existing_collections = await db.list_collection_names()
        print(f"Existing collections: {', '.join(existing_collections) if existing_collections else 'None'}")
        
        for model in models:
            # Handle both v0 and v1 odmantic model config
            if hasattr(model, "model_config"):
                coll_name = model.model_config.get("collection")
            else:
                # Fallback for older odmantic or default naming
                coll_name = model.__name__.lower()
                
            if coll_name and coll_name not in existing_collections:
                print(f"Creating collection: {coll_name}...")
                await db.create_collection(coll_name)
            elif coll_name:
                print(f"Collection {coll_name} already exists.")

        # Initialize default roles if they don't exist
        existing_roles = {role.name: role for role in await engine.find(Role)}
        if not existing_roles.get("Admin"):
            existing_roles["Admin"] = Role(name="Admin", description="System Administrator")
        if not existing_roles.get("Member"):
            existing_roles["Member"] = Role(name="Member", description="Library Member")
        if not existing_roles.get("Librarian"):
            existing_roles["Librarian"] = Role(name="Librarian", description="Library Staff")
        await engine.save_all(list(existing_roles.values()))
        print(f"Successfully ensured roles: {', '.join(existing_roles.keys())}")

        # Seed demo users if they do not exist
        demo_users = [
            {
                "username": "admin",
                "email": "admin@example.com",
                "password": "admin123",
                "role": existing_roles["Admin"],
            },
            {
                "username": "library",
                "email": "library@example.com",
                "password": "library123",
                "role": existing_roles["Librarian"],
            },
            {
                "username": "test123",
                "email": "test123@example.com",
                "password": "123456",
                "role": existing_roles["Member"],
            },
        ]

        for demo in demo_users:
            existing_user = await engine.find_one(User, User.username == demo["username"])
            if existing_user:
                continue
            user_obj = User(
                username=demo["username"],
                email=demo["email"],
                password_hash=get_password_hash(demo["password"]),
                role=demo["role"],
                is_active=True,
            )
            await engine.save(user_obj)
            print(f"Created demo user: {demo['username']}")

        print("--- Initialization complete! ---")
        
    except Exception as e:
        print(f"ERROR during initialization: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
