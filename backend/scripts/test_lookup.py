from pathlib import Path
import os
import asyncio
from dotenv import load_dotenv
from odmantic import AIOEngine, ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).resolve().parent.parent
os.sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / '.env')

async def main():
    client = AsyncIOMotorClient(os.getenv('MONGODB_URL'))
    engine = AIOEngine(client=client, database=os.getenv('DATABASE_NAME'))
    from app.models.document import Document
    ids = [
        '6a04885848c31a33a4abeb17',
        '6a02e7d65ec41ed95be12fe3',
        '6a04885948c31a33a4abeb1b',
    ]
    for id_str in ids:
        print('ID STR', id_str)
        doc = await engine.find_one(Document, Document.id == id_str)
        print(' string query ->', doc.title if doc else None)
        doc2 = await engine.find_one(Document, Document.id == ObjectId(id_str))
        print(' objectid query ->', doc2.title if doc2 else None)
    client.close()

if __name__ == '__main__':
    asyncio.run(main())
