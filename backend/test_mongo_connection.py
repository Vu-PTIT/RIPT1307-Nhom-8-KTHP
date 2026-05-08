import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

# Add current directory to sys.path to import app
sys.path.append(os.getcwd())

from app.core.config import settings

async def test_connection():
    print(f"--- MongoDB Connection Test ---")
    print(f"URL: {settings.MONGODB_URL}")
    print(f"Database: {settings.DATABASE_NAME}")
    
    try:
        # Use a short timeout for the test
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        
        # Verify connection
        print("Pinging server...")
        await client.admin.command('ping')
        print("Connection successful!")
        
        # List databases
        databases = await client.list_database_names()
        print(f"Databases found: {', '.join(databases)}")
        
        # Test specific database access
        db = client[settings.DATABASE_NAME]
        print(f"Pinging database '{settings.DATABASE_NAME}'...")
        await db.command('ping')
        print(f"Database '{settings.DATABASE_NAME}' is accessible.")
        
    except Exception as e:
        print(f"ERROR: Connection failed: {e}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
