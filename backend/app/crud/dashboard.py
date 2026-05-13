from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from odmantic import AIOEngine, ObjectId
from app.models.user import User, Role
from app.models.document import Document, DocumentCopy
from app.models.borrow import BorrowRecord, BorrowRecordItem
from app.models.log import CheckinLog
from app.schemas.dashboard import DashboardSummary, TopBookItem, OverdueItem, OverdueStats, BorrowStatusStats

async def get_dashboard_summary(engine: AIOEngine) -> DashboardSummary:
    total_users = await engine.count(User)
    total_docs = await engine.count(Document)
    active_borrows = await engine.count(BorrowRecord, BorrowRecord.status == "borrowed")
    
    # Checkins today
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_checkins = await engine.count(CheckinLog, CheckinLog.check_time >= today_start)
    
    return DashboardSummary(
        total_users=total_users,
        total_documents=total_docs,
        active_borrows=active_borrows,
        total_checkins_today=today_checkins
    )

async def get_top_borrowed_books(engine: AIOEngine, limit: int = 5) -> List[TopBookItem]:
    # Aggregation to count borrows per document
    collection = engine.get_collection(BorrowRecordItem)
    pipeline = [
        {"$lookup": {
            "from": "document_copies",
            "localField": "document_copy",
            "foreignField": "_id",
            "as": "copy"
        }},
        {"$unwind": "$copy"},
        {"$group": {
            "_id": "$copy.document",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "documents",
            "localField": "_id",
            "foreignField": "_id",
            "as": "doc"
        }},
        {"$unwind": "$doc"}
    ]
    
    cursor = collection.aggregate(pipeline)
    results = await cursor.to_list(length=limit)
    
    items = []
    for res in results:
        items.append(TopBookItem(
            id=res["_id"],
            title=res["doc"]["title"],
            author=res["doc"]["author"],
            borrow_count=res["count"]
        ))
    return items

async def get_overdue_stats(engine: AIOEngine) -> OverdueStats:
    today = date.today()
    # Find active borrow items that are overdue
    active_records = await engine.find(BorrowRecord, (BorrowRecord.status == "borrowed") & (BorrowRecord.due_date < today))
    
    overdue_items = []
    for record in active_records:
        items = await engine.find(BorrowRecordItem, (BorrowRecordItem.borrow_record == record.id) & (BorrowRecordItem.return_date == None))
        reader = await engine.find_one(User, User.id == record.reader.id)
        
        for item in items:
            copy = await engine.find_one(DocumentCopy, DocumentCopy.id == item.document_copy.id)
            doc = await engine.find_one(Document, Document.id == copy.document.id)
            
            days_overdue = (today - record.due_date).days
            
            overdue_items.append(OverdueItem(
                borrow_id=record.id,
                reader_username=reader.username if reader else "Unknown",
                document_title=doc.title if doc else "Unknown",
                due_date=datetime.combine(record.due_date, datetime.min.time()),
                days_overdue=days_overdue
            ))
            
    total_borrows = await engine.count(BorrowRecord)
    overdue_count = len(overdue_items)
    overdue_rate = (overdue_count / total_borrows * 100) if total_borrows > 0 else 0
    
    return OverdueStats(
        overdue_count=overdue_count,
        overdue_rate=round(overdue_rate, 2),
        items=overdue_items
    )

async def get_borrow_status_stats(engine: AIOEngine) -> List[BorrowStatusStats]:
    collection = engine.get_collection(BorrowRecord)
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    cursor = collection.aggregate(pipeline)
    results = await cursor.to_list(length=10)
    
    return [BorrowStatusStats(status=res["_id"], count=res["count"]) for res in results]

async def get_checkin_traffic(engine: AIOEngine, period: str = "daily") -> List[Dict[str, Any]]:
    # Simple logic for now: last 7 days for daily
    collection = engine.get_collection(CheckinLog)
    
    if period == "daily":
        start_date = datetime.utcnow() - timedelta(days=7)
        format_str = "%Y-%m-%d"
    elif period == "weekly":
        start_date = datetime.utcnow() - timedelta(weeks=4)
        format_str = "%Y-W%U"
    else: # monthly
        start_date = datetime.utcnow() - timedelta(days=365)
        format_str = "%Y-%m"
        
    pipeline = [
        {"$match": {"check_time": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": format_str, "date": "$check_time"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    cursor = collection.aggregate(pipeline)
    results = await cursor.to_list(length=100)
    
    return [{"label": res["_id"], "count": res["count"]} for res in results]
