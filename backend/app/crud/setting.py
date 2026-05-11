from typing import Optional, List
from odmantic import AIOEngine
from app.models.setting import LibrarySetting
from app.models.user import User

async def get_setting(engine: AIOEngine, key: str) -> Optional[LibrarySetting]:
    return await engine.find_one(LibrarySetting, LibrarySetting.setting_key == key)

async def set_setting(
    engine: AIOEngine, 
    key: str, 
    value: str, 
    updated_by: Optional[User] = None,
    description: str = ""
) -> LibrarySetting:
    db_obj = await get_setting(engine, key)
    if db_obj:
        db_obj.setting_value = value
        db_obj.updated_by_id = str(updated_by.id) if updated_by else None
        if description:
            db_obj.description = description
    else:
        db_obj = LibrarySetting(
            setting_key=key,
            setting_value=value,
            description=description,
            updated_by_id=str(updated_by.id) if updated_by else None
        )
    await engine.save(db_obj)
    return db_obj

async def get_all_settings(engine: AIOEngine) -> List[LibrarySetting]:
    return await engine.find(LibrarySetting)

async def initialize_library_settings(engine: AIOEngine):
    """
    Initialize default library settings if they don't exist.
    """
    settings_to_init = [
        ("default_max_books", "5", "Default maximum books allowed per user"),
        ("default_max_days", "14", "Default maximum borrowing days allowed"),
    ]
    
    for key, value, desc in settings_to_init:
        existing = await get_setting(engine, key)
        if not existing:
            await set_setting(engine, key, value, description=desc)
