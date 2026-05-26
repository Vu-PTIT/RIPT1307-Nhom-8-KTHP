from pathlib import Path
import os
import sys
from dotenv import load_dotenv
import asyncio
from odmantic import AIOEngine
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / '.env')
uri = os.getenv('MONGODB_URL')
db_name = os.getenv('DATABASE_NAME')

async def main():
    client = AsyncIOMotorClient(uri)
    engine = AIOEngine(client=client, database=db_name)
    from app.models.document import Document
    docs = await engine.find(Document)
    print('found', len(docs), 'documents')
    for d in docs[:100]:
        print(str(d.id), '|', d.title)
    client.close()

if __name__ == '__main__':
    asyncio.run(main())
