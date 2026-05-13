from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.db.session import engine
from app.api import deps
from app.models.user import User, Role
from app.schemas import user as user_schema
from app.schemas import dashboard as dashboard_schema
from app.crud import user as user_crud
from app.crud import dashboard as dashboard_crud

router = APIRouter()

# ===================== USER MANAGEMENT =====================

@router.get("/users", response_model=user_schema.UserListResponse)
async def list_users(
    role_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    keyword: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """List all users with filters (Admin only)."""
    users, total = await user_crud.get_all_users(
        engine, role_id=role_id, is_active=is_active, keyword=keyword, page=page, page_size=page_size
    )
    
    items = []
    for u in users:
        role = await engine.find_one(Role, Role.id == u.role.id)
        items.append(user_schema.UserListItem(
            id=u.id,
            username=u.username,
            email=u.email,
            role_name=role.name if role else "Unknown",
            is_active=u.is_active,
            created_at=u.created_at
        ))
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/users/{id}", response_model=user_schema.User)
async def get_user_detail(
    id: str,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Get detailed user information."""
    user = await user_crud.get_user_by_id(engine, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", response_model=user_schema.User)
async def create_user_admin(
    user_in: user_schema.UserCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Create a new user with specific role (Admin only)."""
    try:
        user = await user_crud.create_user(engine, user_in)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{id}", response_model=user_schema.User)
async def update_user_admin(
    id: str,
    user_in: user_schema.AdminUserUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Update user information and role (Admin only)."""
    try:
        update_data = user_in.model_dump(exclude_unset=True)
        user = await user_crud.update_user(engine, id, update_data)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/users/{id}/toggle-active", response_model=user_schema.User)
async def toggle_user_status(
    id: str,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Lock or unlock a user account."""
    try:
        user = await user_crud.toggle_user_active(engine, id)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/users/{id}")
async def delete_user_admin(
    id: str,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Delete a user account."""
    success = await user_crud.delete_user(engine, id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


# ===================== DASHBOARD & REPORTS =====================

@router.get("/dashboard/summary", response_model=dashboard_schema.DashboardSummary)
async def get_summary(
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Get system summary statistics."""
    return await dashboard_crud.get_dashboard_summary(engine)

@router.get("/dashboard/checkin-traffic", response_model=List[dashboard_schema.CheckinTrafficItem])
async def get_traffic(
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Get check-in traffic data for charts."""
    return await dashboard_crud.get_checkin_traffic(engine, period=period)

@router.get("/dashboard/top-books", response_model=List[dashboard_schema.TopBookItem])
async def get_top_books(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Get most borrowed books."""
    return await dashboard_crud.get_top_borrowed_books(engine, limit=limit)

@router.get("/dashboard/overdue", response_model=dashboard_schema.OverdueStats)
async def get_overdue(
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Get overdue statistics and list."""
    return await dashboard_crud.get_overdue_stats(engine)

@router.get("/dashboard/borrow-stats", response_model=List[dashboard_schema.BorrowStatusStats])
async def get_borrow_stats(
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Get borrow records by status."""
    return await dashboard_crud.get_borrow_status_stats(engine)

@router.get("/dashboard/export")
async def export_excel(
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Export system data to Excel (Stub)."""
    # This would normally use pandas and StreamingResponse
    # For now, we return a message as the library isn't installed yet
    return {"message": "Excel export is ready for implementation. Requires pandas and openpyxl."}
