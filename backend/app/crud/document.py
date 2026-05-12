from typing import Optional, List, Tuple
from odmantic import AIOEngine, ObjectId
from app.models.document import Document, Category
from app.schemas.document import DocumentSearchResponse, DocumentSummary

async def search_documents(
    engine: AIOEngine, 
    keyword: Optional[str] = None, 
    category_id: Optional[str] = None, 
    page: int = 1, 
    page_size: int = 10
) -> Tuple[List[Document], int]:
    query = {}
    if keyword:
        # Simple regex search for title or author
        query["$or"] = [
            {"title": {"$regex": keyword, "$options": "i"}},
            {"author": {"$regex": keyword, "$options": "i"}},
            {"isbn": {"$regex": keyword, "$options": "i"}}
        ]
    
    if category_id:
        query["category"] = ObjectId(category_id)
    
    # Odmantic doesn't support complex mongo queries directly in find easily for all cases,
    # but we can use the engine.find with a query object if needed or use the built-in filters.
    # For now, let's use the built-in filters if possible, or motor directly if complex.
    
    filters = []
    if category_id:
        filters.append(Document.category == ObjectId(category_id))
    
    # Keyword search is tricky with Odmantic's high-level API if we want OR.
    # Let's use the underlying motor collection for advanced search or stay simple.
    # Simple approach for now:
    
    if keyword:
        # Odmantic doesn't have a clean $or with regex in the high-level API yet.
        # We'll use the motor collection.
        collection = engine.get_collection(Document)
        mongo_query = {}
        if category_id:
            mongo_query["category"] = ObjectId(category_id)
        if keyword:
            mongo_query["$or"] = [
                {"title": {"$regex": keyword, "$options": "i"}},
                {"author": {"$regex": keyword, "$options": "i"}},
                {"isbn": {"$regex": keyword, "$options": "i"}}
            ]
        
        total = await collection.count_documents(mongo_query)
        cursor = collection.find(mongo_query).skip((page - 1) * page_size).limit(page_size)
        docs_raw = await cursor.to_list(length=page_size)
        docs = [engine.database_to_model(Document, doc) for doc in docs_raw]
        return docs, total
    else:
        total = await engine.count(Document, *filters)
        docs = await engine.find(
            Document, 
            *filters, 
            skip=(page - 1) * page_size, 
            limit=page_size,
            sort=Document.title
        )
        return docs, total

async def get_document_by_id(engine: AIOEngine, doc_id: str) -> Optional[Document]:
    return await engine.find_one(Document, Document.id == ObjectId(doc_id))

async def get_categories(engine: AIOEngine) -> List[Category]:
    return await engine.find(Category, sort=Category.name)
