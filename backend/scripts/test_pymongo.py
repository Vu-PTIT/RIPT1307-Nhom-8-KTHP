from pathlib import Path
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / '.env')
uri = os.getenv('MONGODB_URL')
db_name = os.getenv('DATABASE_NAME')
client = MongoClient(uri)
db = client[db_name]
for oid in [
    '6a04885948c31a33a4abeb1b',
    '6a04885948c31a33a4abeb1c',
    '6a04885948c31a33a4abeb1d',
]:
    doc = db.documents.find_one({'_id': ObjectId(oid)})
    print(oid, '->', doc.get('title') if doc else None)
