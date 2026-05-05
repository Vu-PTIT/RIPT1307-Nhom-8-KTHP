from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine
from app.core.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
engine = AIOEngine(client=client, database=settings.DATABASE_NAME)

async def get_db():
    return engine.database
