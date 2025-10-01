from fastapi import APIRouter, HTTPException
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import select, exists

from services.ai_api.db import async_session
from services.ai_api.models import *

router = APIRouter()

@router.post("/users/insert")
async def users_insert(payload: UserInsertPayload):
    async with async_session() as session:
        stmt = (
            pg_insert(User)
            .values(telegram_username=payload.telegram_username, telegram_id=payload.telegram_id, privy_id=payload.privy_id)
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

@router.get("/users/has-username")
async def has_username(telegram_id: int):
    async with async_session() as session:
        uid = await session.scalar(select(User.id).where(User.telegram_id == telegram_id))
        if not uid:
            return {"ok": True, "has": False, "username": None}

        has = await session.scalar(select(exists().where(Username.user_id == uid)))
        un = None
        if has:
            un = await session.scalar(select(Username.username).where(Username.user_id == uid))
        return {"ok": True, "has": bool(has), "username": un}

@router.post("/users/onboarding/complete")
async def onboarding_complete(payload: OnboardingPayload):
    async with async_session() as session:
        uid = await session.scalar(select(User.id).where(User.telegram_id == payload.telegram_id))
        if not uid:
            raise HTTPException(status_code=404, detail="User not found by privy_id")

        stmt_u = (
            pg_insert(Username)
            .values(user_id=uid, username=payload.username)
            .on_conflict_do_update(
                index_elements=[Username.user_id],
                set_={"username": pg_insert(Username).excluded.username}
            )
        )

        keys = ["crypto_basics","crypto_wallets","nfts","crypto_games",
                "money_transactions","scam_awareness","exploring","other"]
        tvals = {k: bool(payload.topics.get(k, False)) for k in keys} | {"user_id": uid}

        stmt_t = (
            pg_insert(UserTopics)
            .values(**tvals)
            .on_conflict_do_update(
                index_elements=[UserTopics.user_id],
                set_={k: pg_insert(UserTopics).excluded.__getattribute__(k) for k in keys}
            )
        )

        await session.execute(stmt_u)
        await session.execute(stmt_t)
        await session.commit()

    return {"ok": True}