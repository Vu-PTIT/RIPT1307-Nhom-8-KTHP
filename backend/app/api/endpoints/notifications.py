from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from app.db.session import engine
from app.api import deps
from app.models.user import User
from app.schemas import notification as notification_schema
from app.crud import notification as notification_crud

router = APIRouter()

@router.get("", response_model=List[notification_schema.NotificationResponse])
async def get_my_notifications(
    response: Response,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Get current user's notifications."""
    skip = (page - 1) * page_size
    notifications, total = await notification_crud.get_my_notifications(
        engine, str(current_user.id), skip=skip, limit=page_size
    )
    
    response.headers["x-total-count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "x-total-count"
    
    return [
        notification_schema.NotificationResponse(
            id=str(notif.id),
            title=notif.title,
            message=notif.message,
            type=notif.type,
            is_read=notif.is_read,
            created_at=notif.created_at
        )
        for notif in notifications
    ]

@router.put("/{id}/read")
async def mark_notification_as_read(
    id: str,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Mark a specific notification as read."""
    notif = await notification_crud.mark_as_read(engine, id, str(current_user.id))
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Success"}

@router.put("/read-all")
async def mark_all_notifications_as_read(
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Mark all notifications of current user as read."""
    await notification_crud.mark_all_as_read(engine, str(current_user.id))
    return {"message": "Success"}

@router.post("/check-overdue")
async def trigger_overdue_check(
    current_user: User = Depends(deps.get_current_librarian)
) -> Any:
    """
    Trigger check for overdue books and send notifications.
    Can only be run by a librarian or admin.
    """
    from datetime import datetime
    from app.models.borrow import BorrowRecord, BorrowRecordItem
    
    # We find all borrow items without return_date where due_date < today
    items = await engine.find(
        BorrowRecordItem,
        BorrowRecordItem.return_date == None
    )
    
    today = datetime.now().date()
    overdue_items = []
    for item in items:
        # Determine due_date (from item, fallback to record)
        due_date = item.due_date
        if not due_date:
            record = await engine.find_one(BorrowRecord, BorrowRecord.id == item.borrow_record)
            if record:
                due_date = record.due_date
                
        if due_date and due_date.date() < today:
            overdue_items.append(item)
            
    if not overdue_items:
        return {"message": "No overdue items found", "count": 0}
        
    count = 0
    notified_users = set()
    for item in overdue_items:
        record = await engine.find_one(BorrowRecord, BorrowRecord.id == item.borrow_record)
        if not record:
            continue
            
        user_id = str(record.reader)
        
        # We can create a notification for the user
        await notification_crud.create_notification(
            engine,
            user_id=user_id,
            title="Sách quá hạn",
            message=f"Bạn có sách mượn đã quá hạn từ {due_date.strftime('%d/%m/%Y')}. Vui lòng trả sách sớm nhất có thể.",
            notif_type="overdue"
        )
        notified_users.add(user_id)
        count += 1
        
    # Notify librarians about the overdue sweep
    if count > 0:
        await notification_crud.notify_librarians(
            engine,
            title="Báo cáo quá hạn sách",
            message=f"Đã phát hiện {count} mục sách quá hạn từ {len(notified_users)} độc giả.",
            notif_type="overdue_report"
        )

    return {"message": "Overdue check completed", "overdue_items_count": count, "notified_users": len(notified_users)}
