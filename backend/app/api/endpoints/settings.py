from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.session import engine
from app.api import deps
from app.schemas import setting as setting_schema
from app.crud import setting as setting_crud
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[setting_schema.LibrarySetting])
async def get_settings() -> Any:
    """
    Retrieve library settings.
    """
    settings = await setting_crud.get_all_settings(engine)
    return settings

@router.patch("/{key}", response_model=setting_schema.LibrarySetting)
async def update_setting(
    key: str,
    setting_in: setting_schema.LibrarySettingUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a library setting.
    """
    setting = await setting_crud.get_setting(engine, key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    updated_setting = await setting_crud.set_setting(
        engine, 
        key=key, 
        value=setting_in.setting_value if setting_in.setting_value is not None else setting.setting_value,
        updated_by=current_user,
        description=setting_in.description if setting_in.description is not None else setting.description
    )
    return updated_setting
