from fastapi import APIRouter
from app.api.endpoints import health, items

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(items.router, prefix="/items", tags=["items"])
# You can include more routers here as you develop
# api_router.include_router(users.router, prefix="/users", tags=["users"])
