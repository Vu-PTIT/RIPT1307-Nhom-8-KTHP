from fastapi import APIRouter
from app.api.endpoints import health, auth, settings, documents, categories, wishlist, borrow_cart, borrows, renewals, checkin, admin

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
api_router.include_router(borrow_cart.router, prefix="/cart", tags=["borrow-cart"])
api_router.include_router(borrows.router, prefix="/borrows", tags=["borrows"])
api_router.include_router(renewals.router, prefix="/renewals", tags=["renewals"])
api_router.include_router(checkin.router, prefix="/checkin", tags=["checkin"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])


