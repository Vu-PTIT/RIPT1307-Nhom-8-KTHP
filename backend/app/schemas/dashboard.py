from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from .user import PyObjectId

class DashboardSummary(BaseModel):
    total_users: int
    total_documents: int
    active_borrows: int
    total_checkins_today: int

class CheckinTrafficItem(BaseModel):
    label: str  # Date or hour string
    count: int

class TopBookItem(BaseModel):
    id: PyObjectId
    title: str
    author: str
    borrow_count: int

class OverdueItem(BaseModel):
    borrow_id: PyObjectId
    reader_username: str
    document_title: str
    due_date: datetime
    days_overdue: int

class OverdueStats(BaseModel):
    overdue_count: int
    overdue_rate: float
    items: List[OverdueItem]

class BorrowStatusStats(BaseModel):
    status: str
    count: int

class DashboardData(BaseModel):
    summary: DashboardSummary
    top_books: List[TopBookItem]
    overdue_stats: OverdueStats
    borrow_status: List[BorrowStatusStats]
