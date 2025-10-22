from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import select, and_, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from services.ai_api.models import User, QuizProgress, QuizStateResponse, QuizAnswerPayload, QuizAnswer, NFTMint, \
    ClaimPayload, UserWallet, WelcomeMintPayload
from services.ai_api.onchain import mint_badge
from .db import get_session
from sqlalchemy.exc import OperationalError


def today_utc() -> date:
    return datetime.now(timezone.utc).date()


router = APIRouter(prefix="/quiz", tags=["quiz"])

QUESTIONS = [
    {
        "title": "Day 1 — What Is Web3?",
        "question": "Which version of the internet allows you to own your content?",
        "options": ["Web1", "Web2", "Web3"],
        "correct": 2,
    },
    {
        "title": "Day 2 — Web1 vs Web2",
        "question": "What best describes Web2?",
        "options": ["Read-only websites", "Interactive platforms controlled by companies",
                    "Fully decentralised social media"],
        "correct": 1,
    },
    {
        "title": "Day 3 — Why Web3 Matters",
        "question": "What problem does Web3 aim to solve?",
        "options": ["Adding more adverts", "Centralised control of data", "Faster loading times"],
        "correct": 1,
    },
    {
        "title": "Day 4 — Real-World Use Cases",
        "question": "Which is a real-world benefit of Web3?",
        "options": ["Owning and trading in-game items", "Posting longer videos", "Automatic password resets"],
        "correct": 0,
    },
    {
        "title": "Day 5 — Blockchain Basics",
        "question": "What is a blockchain?",
        "options": ["A central company database", "A shared record book that everyone can verify",
                    "A government registry"],
        "correct": 1,
    },
    {
        "title": "Day 6 — Blockchain Integrity",
        "question": "Why is blockchain data hard to change?",
        "options": ["It’s stored on many computers", "It’s in one secure server", "It deletes itself daily"],
        "correct": 0,
    },
    {
        "title": "Day 7 — Crypto 101",
        "question": "What makes cryptocurrency different from regular money?",
        "options": ["It’s printed by banks", "It’s decentralised and not controlled by one authority",
                    "It only exists as coins"],
        "correct": 1,
    },
    {
        "title": "Day 8 — Bitcoin & Ethereum",
        "question": "What is Ethereum mainly used for?",
        "options": ["Streaming music", "Running smart contracts and apps", "Printing NFTs"],
        "correct": 1,
    },
    {
        "title": "Day 9 — Stablecoins",
        "question": "What’s unique about stablecoins like USDC?",
        "options": ["They change price daily", "They’re tied to traditional currencies",
                    "They’re only for games"],
        "correct": 1,
    },
    {
        "title": "Day 10 — Web3 Wallet Basics",
        "question": "A Web3 wallet is like:",
        "options": ["An email inbox", "Your digital passport holding assets", "A photo album"],
        "correct": 1,
    },
    {
        "title": "Day 11 — Wallet Security",
        "question": "What’s the golden rule for your seed phrase?",
        "options": ["Share it with support staff", "Keep it private and offline", "Store it in screenshots"],
        "correct": 1,
    },
    {
        "title": "Day 12 — Sending Crypto",
        "question": "When you send crypto, what happens?",
        "options": ["A bank approves it", "The blockchain network validates and records it",
                    "It disappears temporarily"],
        "correct": 1,
    },
    {
        "title": "Day 13 — Signing Transactions",
        "question": "Why do you “sign” a transaction?",
        "options": ["To decorate it", "To authorise an action from your wallet", "To send an email"],
        "correct": 1,
    },
    {
        "title": "Day 14 — Review & Badge",
        "question": "Blockchain networks are maintained by:",
        "options": ["A single government agency", "Thousands of computers", "Private companies only"],
        "correct": 1,
    },
]
TOTAL = len(QUESTIONS)

WELCOME_TOKEN_ID = 1000
WELCOME_INDEX = WELCOME_TOKEN_ID - 1


async def _get_uid_by_privy(session, privy_id: str) -> int:
    uid = await session.scalar(select(User.id).where(User.privy_id == privy_id))
    if not uid:
        raise HTTPException(status_code=404, detail="User not found by privy_id")
    return uid


def token_id_for_index(quiz_index: int) -> int:
    return quiz_index + 1


@router.get("/state", response_model=QuizStateResponse)
async def quiz_state(privy_id: str = Query(...), session: AsyncSession = Depends(get_session)):
    today = today_utc()
    uid = await _get_uid_by_privy(session, privy_id)

    row = await session.get(QuizProgress, uid)
    if not row:
        row = QuizProgress(user_id=uid, completed_index=-1, last_correct_date=None)
        session.add(row)
        await session.commit()
        await session.refresh(row)

    locked_today = (row.last_correct_date == today)

    idx = row.completed_index if locked_today else row.completed_index + 1

    if idx >= TOTAL:
        return QuizStateResponse(finished=True, locked=True, index=None, total=TOTAL)

    has_unclaimed = False
    if locked_today and idx >= 0:
        minted = await session.scalar(
            select(NFTMint.user_id).where(
                and_(NFTMint.user_id == uid, NFTMint.quiz_index == idx)
            )
        )
        has_unclaimed = (minted is None)

    mint_count = await session.scalar(
        select(func.count()).select_from(NFTMint).where(NFTMint.user_id == uid)
    )
    has_any_badge = bool(mint_count)

    q = QUESTIONS[idx]
    return QuizStateResponse(
        finished=False,
        locked=locked_today,
        index=idx,
        total=TOTAL,
        title=q["title"],
        question=q["question"],
        options=q["options"],
        selected_index=(q["correct"] if locked_today else None),
        has_unclaimed=has_unclaimed,
        has_any_badge=has_any_badge,
    )


@router.post("/answer")
async def quiz_answer(payload: QuizAnswerPayload, session: AsyncSession = Depends(get_session)):
    today = today_utc()
    uid = await _get_uid_by_privy(session, payload.privy_id)
    row = await session.get(QuizProgress, uid)
    if not row:
        row = QuizProgress(user_id=uid, completed_index=-1, last_correct_date=None)
        session.add(row)
        await session.commit()
        await session.refresh(row)

    if row.last_correct_date == today:
        return {"ok": False, "locked": True, "reason": "already_answered_today"}

    idx = row.completed_index + 1
    if idx >= TOTAL:
        return {"ok": False, "finished": True}

    correct_idx = QUESTIONS[idx]["correct"]
    is_correct = (payload.option_index == correct_idx)

    if is_correct:
        row.completed_index = idx
        row.last_correct_date = today
        await session.execute(
            pg_insert(QuizAnswer)
            .values(user_id=uid, answered_on=today, quiz_index=idx)
            .on_conflict_do_nothing()
        )
        await session.commit()

    return {
        "ok": True,
        "correct": is_correct,
        "locked": True if is_correct else False,
        "has_unclaimed": True if is_correct else False,
        "index": idx,
        "total": TOTAL,
    }


@router.get("/week")
async def quiz_week(privy_id: str, date_from: date, date_to: date, session: AsyncSession = Depends(get_session)):
    uid = await _get_uid_by_privy(session, privy_id)
    rows = await session.execute(
        select(QuizAnswer.answered_on).where(
            and_(QuizAnswer.user_id == uid,
                 QuizAnswer.answered_on >= date_from,
                 QuizAnswer.answered_on <= date_to)
        )
    )
    days = [d.isoformat() for d in rows.scalars().all()]
    return {"days": days}


@router.post("/claim")
async def claim_quiz_reward(payload: ClaimPayload, session: AsyncSession = Depends(get_session)):
    # 1) user
    uid = await session.scalar(select(User.id).where(User.privy_id == payload.privy_id))
    if not uid:
        raise HTTPException(status_code=404, detail="user_not_found")

    # 2) строка ответа за сегодня под блокировкой (исключаем конкуренцию клеймов)
    today = today_utc()
    try:
        res = await session.execute(
            select(QuizAnswer).where(
                (QuizAnswer.user_id == uid) & (QuizAnswer.answered_on == today)
            ).with_for_update()
        )
    except OperationalError:
        raise HTTPException(status_code=409, detail="claim_in_progress")

    qa: QuizAnswer | None = res.scalar_one_or_none()

    if not qa:
        raise HTTPException(status_code=400, detail="no_answer_today")

    if qa.claimed:
        return {"already": True, "token_id": qa.token_id}

    token_id = token_id_for_index(qa.quiz_index)

    # 3) wallet address
    addr = await session.scalar(
        select(UserWallet.address)
        .where(UserWallet.user_id == uid)
        .order_by(UserWallet.is_primary.desc(), UserWallet.created_at.asc())
    )
    if not addr:
        raise HTTPException(status_code=400, detail="user_has_no_wallet")

    # 4) mint
    try:
        tx_hash = await mint_badge(addr, token_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint_error:{e}")

    # 5) set status claimed
    qa.claimed = True
    qa.token_id = token_id
    qa.claimed_at = datetime.now(timezone.utc)
    await session.execute(
        pg_insert(NFTMint)
        .values(user_id=uid, quiz_index=qa.quiz_index, tx_hash=tx_hash)
        .on_conflict_do_nothing()
    )
    await session.commit()

    return {"token_id": token_id, "tx_hash": tx_hash, "already": False}


@router.get("/owned")
async def quiz_owned(privy_id: str, session: AsyncSession = Depends(get_session)):
    uid = await session.scalar(select(User.id).where(User.privy_id == privy_id))
    if not uid:
        raise HTTPException(status_code=404, detail="User not found")

    rows = await session.scalars(
        select(NFTMint.quiz_index).where(NFTMint.user_id == uid)
    )
    idxs = rows.all()
    token_ids = [token_id_for_index(i) for i in idxs]
    return {"count": len(token_ids), "token_ids": token_ids}


@router.post("/mint-onboarding")
async def mint_onboarding_badge(payload: WelcomeMintPayload, session: AsyncSession = Depends(get_session)):
    # 1) user
    uid = await session.scalar(select(User.id).where(User.privy_id == payload.privy_id))
    if not uid:
        raise HTTPException(status_code=404, detail="user_not_found")

    # 2) minted yet
    existed = await session.scalar(
        select(NFTMint.user_id).where(and_(NFTMint.user_id == uid, NFTMint.quiz_index == WELCOME_INDEX))
    )
    if existed:
        return {"token_id": WELCOME_TOKEN_ID, "already": True}

    # 3) has wallet
    addr = await session.scalar(
        select(UserWallet.address)
        .where(UserWallet.user_id == uid)
        .order_by(UserWallet.is_primary.desc(), UserWallet.created_at.asc())
    )
    if not addr:
        raise HTTPException(status_code=400, detail="user_has_no_wallet")

    # 4) mint
    try:
        tx_hash = await mint_badge(addr, WELCOME_TOKEN_ID)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint_error:{e}")

    # 5) to db
    await session.execute(
        pg_insert(NFTMint)
        .values(user_id=uid, quiz_index=WELCOME_INDEX, tx_hash=tx_hash)
        .on_conflict_do_nothing()
    )
    await session.commit()

    return {"token_id": WELCOME_TOKEN_ID, "tx_hash": tx_hash, "already": False}


@router.get("/minted")
async def quiz_minted(privy_id: str, session: AsyncSession = Depends(get_session)):
    uid = await session.scalar(select(User.id).where(User.privy_id == privy_id))
    if not uid:
        raise HTTPException(status_code=404, detail="user_not_found")

    rows = await session.execute(
        select(NFTMint.quiz_index, NFTMint.tx_hash).where(NFTMint.user_id == uid)
    )
    items = [{"token_id": r[0] + 1, "tx_hash": r[1]} for r in rows.all()]
    return {"items": items}
