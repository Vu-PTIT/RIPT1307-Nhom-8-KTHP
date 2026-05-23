import asyncio
import sys
import os

# Add current directory to sys.path to import app
sys.path.append(os.getcwd())

from app.db.session import engine
from app.models.user import Role, User
from app.models.document import Category, Document, DocumentCopy
from app.models.borrow import Wishlist, BorrowCartItem, BorrowRecord, BorrowRecordItem, RenewalRequest
from app.models.setting import LibrarySetting
from app.models.log import CheckinLog
from app.crud import user as user_crud
from app.schemas.user import UserCreate

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
        roles_count = await engine.count(Role)
        if roles_count == 0:
            print("Creating default roles...")
            admin_role = Role(name="Admin", description="System Administrator")
            member_role = Role(name="Member", description="Library Member")
            await engine.save_all([admin_role, member_role])
            print(f"Successfully created roles: Admin, Member")
        else:
            print(f"Roles present: {roles_count}")

        # Ensure test users exist (admin and test user)
        try:
            admin_role = await engine.find_one(Role, Role.name == "Admin")
            member_role = await engine.find_one(Role, Role.name == "Member")
            users_to_ensure = [
                {"username": "admin", "email": "admin@example.com", "password": "admin123", "role": admin_role},
                {"username": "test123", "email": "test123@example.com", "password": "123456", "role": member_role},
            ]
            for u in users_to_ensure:
                existing = await engine.find_one(User, User.username == u["username"])
                if not u["role"]:
                    print(f"Skipping creation of {u['username']} - role missing")
                    continue
                user_in = UserCreate(
                    username=u["username"],
                    email=u["email"],
                    password=u["password"],
                    role_id=str(u["role"].id),
                )
                try:
                    if existing:
                        await user_crud.update_user(
                            engine,
                            str(existing.id),
                            {
                                "email": u["email"],
                                "password": u["password"],
                                "role_id": str(u["role"].id),
                                "is_active": True,
                            },
                        )
                        print(f"Updated seeded user: {u['username']}")
                    else:
                        created = await user_crud.create_user(engine, user_in)
                        print(f"Created user: {created.username}")
                except Exception as e:
                    print(f"Failed creating/updating user {u['username']}: {e}")
        except Exception as e:
            print(f"ERROR ensuring test users: {e}")
        
        print("--- Initialization complete! ---")
        
    except Exception as e:
        print(f"ERROR during initialization: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
