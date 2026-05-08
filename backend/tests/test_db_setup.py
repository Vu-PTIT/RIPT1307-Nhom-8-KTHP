import sys
import os
from datetime import datetime, date

# Add the current directory and backend path to sys.path
current_dir = os.getcwd()
backend_path = os.path.join(current_dir, "backend")
sys.path.append(backend_path)

# Mocking app.core.config to avoid error if env vars are missing
from unittest.mock import MagicMock
sys.modules["app.core.config"] = MagicMock()
sys.modules["app.core.config"].settings = MagicMock()
sys.modules["app.core.config"].settings.MONGODB_URL = "mongodb://localhost:27017"
sys.modules["app.core.config"].settings.DATABASE_NAME = "test_db"

from app.models.user import Role, User
from app.models.document import Category, Document, DocumentCopy
from app.models.borrow import Wishlist, BorrowCartItem, BorrowRecord, BorrowRecordItem, RenewalRequest
from app.models.log import CheckinLog
from app.models.setting import LibrarySetting

def test_models():
    print("Testing model instantiation...")
    
    # Role
    role = Role(name="Admin", description="Administrator")
    print(f"Role created: {role.name}")
    
    # User
    user = User(
        role=role,
        username="admin",
        email="admin@example.com",
        password_hash="hash",
        tier="premium"
    )
    print(f"User created: {user.username}")
    
    # Category
    cat = Category(name="Science Fiction", slug="sci-fi")
    print(f"Category created: {cat.name}")
    
    # Document
    doc = Document(
        category=cat,
        title="Dune",
        author="Frank Herbert",
        total_copies=10,
        available_copies=10,
        created_by=user
    )
    print(f"Document created: {doc.title}")
    
    # DocumentCopy
    copy = DocumentCopy(
        document=doc,
        copy_code="DUNE-001"
    )
    print(f"DocumentCopy created: {copy.copy_code}")
    
    # BorrowRecord
    record = BorrowRecord(
        reader=user,
        librarian=user,
        borrow_date=date.today(),
        due_date=date.today()
    )
    print(f"BorrowRecord created for: {record.reader.username}")

    # BorrowRecordItem
    record_item = BorrowRecordItem(
        borrow_record=record,
        document_copy=copy
    )
    print(f"BorrowRecordItem created for: {record_item.document_copy.copy_code}")
    
    print("All models instantiated successfully!")

if __name__ == "__main__":
    try:
        test_models()
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
