from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from services.ai_api.models import User, UserWallet, WalletUpsertPayload, WalletDTO
from .db import get_session

router = APIRouter(tags=["wallets"])


def _row_to_dto(w: UserWallet) -> WalletDTO:
    return WalletDTO(
        id=w.id,
        chain_type=w.chain_type,
        address=w.address,
        privy_wallet_id=w.privy_wallet_id,
        is_embedded=w.is_embedded,
        is_primary=w.is_primary,
        created_at=str(w.created_at),
    )


@router.get("/wallets/by-privy", response_model=list[WalletDTO])
async def get_wallets_by_privy(privy_id: str = Query(..., description="Privy user id"),
                               session: AsyncSession = Depends(get_session)):
    user_id = await session.scalar(select(User.id).where(User.privy_id == privy_id))
    if not user_id:
        return []

    rows = (await session.execute(
        select(UserWallet).where(UserWallet.user_id == user_id).order_by(UserWallet.created_at.asc())
    )).scalars().all()

    return [_row_to_dto(w) for w in rows]


@router.post("/wallets/insert", response_model=WalletDTO)
async def upsert_wallet(payload: WalletUpsertPayload,
                        session: AsyncSession = Depends(get_session)):
    normalized_address = payload.address.lower()

    # 1) find users.id by privy_id
    user_id = await session.scalar(select(User.id).where(User.privy_id == payload.privy_id))
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found by privy_id")

    # 2) INSERT
    insert_values = {
        "user_id": user_id,
        "privy_wallet_id": payload.wallet_id,
        "chain_type": payload.chain_type,
        "address": payload.address,
        "is_embedded": payload.is_embedded,
    }

    if payload.wallet_id:
        ins = pg_insert(UserWallet).values(**insert_values).on_conflict_do_update(
            index_elements=[UserWallet.privy_wallet_id],
            set_={
                "user_id": user_id,
                "chain_type": payload.chain_type,
                "address": payload.address,
                "is_embedded": payload.is_embedded,
            },
        )
    else:
        ins = pg_insert(UserWallet).values(**insert_values).on_conflict_do_update(
            index_elements=[UserWallet.user_id, UserWallet.chain_type, UserWallet.address_lower],
            set_={
                "address": payload.address,
                "is_embedded": payload.is_embedded,
            },
        )

    await session.execute(ins)

    # 3) optionally set primary
    if payload.is_primary:
        await session.execute(
            update(UserWallet)
            .where(UserWallet.user_id == user_id)
            .values(is_primary=False)
        )
        await session.execute(
            update(UserWallet)
            .where(
                (UserWallet.user_id == user_id) &
                (UserWallet.chain_type == payload.chain_type) &
                (UserWallet.address_lower == normalized_address)
            )
            .values(is_primary=True)
        )

    await session.commit()

    # 4) Post line
    row = await session.scalar(
        select(UserWallet).where(
            (UserWallet.user_id == user_id) &
            (UserWallet.chain_type == payload.chain_type) &
            (UserWallet.address_lower == normalized_address)
        )
    )
    if not row:
        if payload.wallet_id:
            row = await session.scalar(
                select(UserWallet).where(UserWallet.privy_wallet_id == payload.wallet_id)
            )
    if not row:
        raise HTTPException(status_code=500, detail="Upsert ok, but record not found")

    return _row_to_dto(row)
