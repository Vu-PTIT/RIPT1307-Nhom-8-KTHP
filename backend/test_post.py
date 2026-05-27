import os
import sys
import asyncio

# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from app.models.user import User
from app.models.borrow import BorrowRecordItem
from app.crud import borrow as borrow_crud
from app.schemas import borrow as borrow_schema
from app.api.endpoints.renewals import _build_renewal_response

async def test_flow():
    # Find any user
    user = await engine.find_one(User)
    if not user:
        print("No user found in database")
        return
    print(f"Found user: {user.username} (id: {user.id}, role: {user.role})")
    
    # Find a borrow record item
    item = await engine.find_one(BorrowRecordItem)
    if not item:
        print("No borrow record item found")
        return
    print(f"Found borrow item: {item.id}")
    
    # Simulate DB crud create
    try:
        # Let's check if there's already a pending request to prevent duplicate error
        existing = await engine.find_one(
            BorrowRecordItem,
            BorrowRecordItem.id == item.id
        )
        print("Item verify:", existing is not None)
        
        # Test building response
        # Let's find any existing renewal request in DB first to see if it can serialize
        from app.models.borrow import RenewalRequest
        renewal = await engine.find_one(RenewalRequest)
        if renewal:
            print("Found existing renewal request in DB:", renewal.id)
            res = await _build_renewal_response(renewal)
            print("Successfully serialized existing renewal:", res.json())
        else:
            print("No existing renewal requests in DB to test serialization")
            
    except Exception as e:
        import traceback
        traceback.print_exc()

# Run async in event loop
loop = asyncio.get_event_loop()
loop.run_until_complete(test_flow())
