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
    today = datetime.utcnow()
    collection = engine.get_collection(BorrowRecordItem)
    
    pipeline = [
        {"$match": {"return_date": None}},
        {"$lookup": {
            "from": "borrow_records",
            "localField": "borrow_record",
            "foreignField": "_id",
            "as": "record"
        }},
        {"$unwind": "$record"},
        {"$match": {"record.status": "borrowed"}},
        {"$lookup": {
            "from": "users",
            "localField": "record.reader",
            "foreignField": "_id",
            "as": "reader"
        }},
        {"$unwind": {"path": "$reader", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {
            "from": "document_copies",
            "localField": "document_copy",
            "foreignField": "_id",
            "as": "copy"
        }},
        {"$unwind": {"path": "$copy", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {
            "from": "documents",
            "localField": "copy.document",
            "foreignField": "_id",
            "as": "doc"
        }},
        {"$unwind": {"path": "$doc", "preserveNullAndEmptyArrays": True}}
    ]
    
    cursor = collection.aggregate(pipeline)
    results = await cursor.to_list(length=None)
    
    overdue_items = []
    for res in results:
        record = res.get("record", {})
        item_due_date = res.get("due_date") or record.get("due_date")
        
        if not item_due_date:
            continue
            
        if item_due_date < today:
            reader = res.get("reader") or {}
            doc = res.get("doc") or {}
            
            # Ensure we can call .date() by checking type
            if isinstance(item_due_date, datetime):
                days_overdue = (today.date() - item_due_date.date()).days
            else:
                # If it's a date or string, try to handle or just use 0
                days_overdue = (today.date() - item_due_date).days if isinstance(item_due_date, date) else 0
                
            overdue_items.append(OverdueItem(
                borrow_id=record.get("_id"),
                reader_username=reader.get("username", "Unknown") if reader else "Unknown",
                document_title=doc.get("title", "Unknown") if doc else "Unknown",
                due_date=item_due_date,
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
