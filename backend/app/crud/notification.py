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
    """Send notification to all active librarians and admins."""
    # Find roles
    roles = await engine.find(Role, Role.name.in_(["librarian", "admin"]))
    role_ids = [r.id for r in roles]
    
    if not role_ids:
        return
        
    # Find all users with these roles
    librarians = await engine.find(User, User.role.in_(role_ids), User.is_active == True)
    
    notifications = []
    for lib in librarians:
        notifications.append(
            Notification(
                user=lib,
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
