from fastapi import Depends, APIRouter, HTTPException
from sqlalchemy import select, exists
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from services.ai_api.models import *
from .db import get_session

router = APIRouter()


@router.post("/users/insert")
async def users_insert(payload: UserInsertPayload, session: AsyncSession = Depends(get_session)):
    stmt = (
        pg_insert(User)
        .values(telegram_username=payload.telegram_username, telegram_id=payload.telegram_id,
                privy_id=payload.privy_id)
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


@router.post("/users/username/update")
async def update_username(payload: UsernameUpdatePayload, session: AsyncSession = Depends(get_session)):
    uid = await session.scalar(select(User.id).where(User.privy_id == payload.privy_id))
    if not uid:
        raise HTTPException(status_code=404, detail="User not found by privy_id")

    stmt = (
        pg_insert(Username)
        .values(user_id=uid, username=payload.username)
        .on_conflict_do_update(
            index_elements=[Username.user_id],
            set_={"username": pg_insert(Username).excluded.username},
        )
    )
    await session.execute(stmt)
    await session.commit()

    return {"ok": True}


@router.get("/users/has-username")
async def has_username(privy_id: str, session: AsyncSession = Depends(get_session)):
    uid = await session.scalar(select(User.id).where(User.privy_id == privy_id))
    if not uid:
        return {"ok": True, "has": False, "username": None}

    has = await session.scalar(select(exists().where(Username.user_id == uid)))
    un = None
    if has:
        un = await session.scalar(select(Username.username).where(Username.user_id == uid))
    return {"ok": True, "has": bool(has), "username": un}


@router.post("/users/onboarding/complete")
async def onboarding_complete(payload: OnboardingPayload, session: AsyncSession = Depends(get_session)):
    uid = await session.scalar(select(User.id).where(User.privy_id == payload.privy_id))
    if not uid:
        raise HTTPException(status_code=404, detail="User not found by privy_id")

    stmt_usernames = (
        pg_insert(Username)
        .values(user_id=uid, username=payload.username)
        .on_conflict_do_update(
            index_elements=[Username.user_id],
            set_={"username": pg_insert(Username).excluded.username}
        )
    )

    keys = ["crypto_basics", "crypto_wallets", "nfts", "crypto_games",
            "money_transactions", "scam_awareness", "exploring", "other"]

    topics_values = {k: bool(payload.topics.get(k, False)) for k in keys} | {"user_id": uid}

    insert_topics_stmt = pg_insert(UserTopics).values(**topics_values)

    stmt_topics = insert_topics_stmt.on_conflict_do_update(
        index_elements=[UserTopics.user_id],
        set_={k: getattr(insert_topics_stmt.excluded, k) for k in keys}
    )

    await session.execute(stmt_usernames)
    await session.execute(stmt_topics)
    await session.commit()

    return {"ok": True}
