from fastapi import APIRouter
from app.api.endpoints import health

api_router = APIRouter()
api_router.include_router(health.router)
# You can include more routers here as you develop
# api_router.include_router(users.router, prefix="/users", tags=["users"])
