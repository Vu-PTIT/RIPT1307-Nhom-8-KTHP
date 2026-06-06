from odmantic import AIOEngine, ObjectId
from typing import List, Optional
from app.models.notification import Notification
from app.models.user import User, Role

async def create_notification(
    engine: AIOEngine, 
    user_id: str, 
    title: str, 
    message: str, 
    notif_type: str
) -> Notification:
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    if not user:
        raise ValueError("User not found")
        
    notification = Notification(
        user=user,
        title=title,
        message=message,
        type=notif_type
    )
    await engine.save(notification)
    return notification

async def notify_librarians(
    engine: AIOEngine,
    title: str,
    message: str,
    notif_type: str
):
    """Send notification to all active librarians and admins using raw Motor queries."""
    import re
    role_col = engine.get_collection(Role)
    user_col = engine.get_collection(User)

    # Find role IDs where name is 'librarian' or 'admin' (case-insensitive)
    role_docs = await role_col.find({
        "name": {"$regex": re.compile(r"^(librarian|admin)$", re.IGNORECASE)}
    }).to_list(length=None)
    role_ids = [r["_id"] for r in role_docs]

    if not role_ids:
        return

    # Find all active users with those roles
    user_docs = await user_col.find({
        "role": {"$in": role_ids},
        "is_active": True
    }).to_list(length=None)

    if not user_docs:
        return

    notifications = []
    for u in user_docs:
        user_obj = await engine.find_one(User, User.id == u["_id"])
        if user_obj:
            notifications.append(
                Notification(
                    user=user_obj,
                    title=title,
                    message=message,
                    type=notif_type
                )
            )

    if notifications:
        await engine.save_all(notifications)

async def get_my_notifications(
    engine: AIOEngine, 
    user_id: str, 
    skip: int = 0, 
    limit: int = 20
) -> tuple[List[Notification], int]:
    filters = (Notification.user == ObjectId(user_id))
    
    total = await engine.count(Notification, filters)
    notifications = await engine.find(
        Notification, 
        filters,
        skip=skip,
        limit=limit,
        sort=Notification.created_at.desc()
    )
    
    return notifications, total

async def mark_as_read(
    engine: AIOEngine, 
    notification_id: str, 
    user_id: str
) -> Optional[Notification]:
    notification = await engine.find_one(
        Notification, 
        (Notification.id == ObjectId(notification_id)) & (Notification.user == ObjectId(user_id))
    )
    
    if notification:
        notification.is_read = True
        await engine.save(notification)
        
    return notification

async def mark_all_as_read(
    engine: AIOEngine,
    user_id: str
):
    notifications = await engine.find(
        Notification,
        (Notification.user == ObjectId(user_id)) & (Notification.is_read == False)
    )
    
    for notif in notifications:
        notif.is_read = True
        
    if notifications:
        await engine.save_all(notifications)
