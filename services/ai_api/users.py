from fastapi import APIRouter
from sqlalchemy.dialects.postgresql import insert as pg_insert

from services.ai_api.db import async_session
from services.ai_api.models import *

router = APIRouter()

@router.post("/users/insert")
async def users_insert(payload: UserInsertPayload):
    async with async_session() as session:
        stmt = (
            pg_insert(User)
            .values(telegram_id=payload.telegram_id, privy_id=payload.privy_id)
            .on_conflict_do_update(
                index_elements=[User.telegram_id],
                set_={
                    "privy_id": func.coalesce(User.privy_id, pg_insert(User).excluded.privy_id)
                }
            )
            .returning(User.id, User.telegram_id, User.privy_id, User.reg_date)
        )

        res = await session.execute(stmt)
        row = res.mappings().first()
        await session.commit()

    return {"ok": True, "user": dict(row) if row else None}