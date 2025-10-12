from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from datetime import date

from services.ai_api.db import async_session
from services.ai_api.models import User, QuizProgress, QuizStateResponse, QuizAnswerPayload

router = APIRouter()

# Вопросы (можешь вынести в json и читать при старте)
QUESTIONS = [
    {
        "title": "Day 1 — What Is Web3?",
        "question": "Which version of the internet allows you to own your content?",
        "options": ["A) Web1", "B) Web2", "C) Web3"],
        "correct": 2,
    },
    {
        "title": "Day 2 — Web1 vs Web2",
        "question": "What best describes Web2?",
        "options": ["A) Read-only websites", "B) Interactive platforms controlled by companies", "C) Fully decentralised social media"],
        "correct": 1,
    },
    {
        "title": "Day 3 — Why Web3 Matters",
        "question": "What problem does Web3 aim to solve?",
        "options": ["A) Adding more adverts", "B) Centralised control of data", "C) Faster loading times"],
        "correct": 1,
    },
    {
        "title": "Day 4 — Real-World Use Cases",
        "question": "Which is a real-world benefit of Web3?",
        "options": ["A) Owning and trading in-game items", "B) Posting longer videos", "C) Automatic password resets"],
        "correct": 0,
    },
    {
        "title": "Day 5 — Blockchain Basics",
        "question": "What is a blockchain?",
        "options": ["A) A central company database", "B) A shared record book that everyone can verify", "C) A government registry"],
        "correct": 1,
    },
    {
        "title": "Day 6 — Blockchain Integrity",
        "question": "Why is blockchain data hard to change?",
        "options": ["A) It’s stored on many computers", "B) It’s in one secure server", "C) It deletes itself daily"],
        "correct": 0,
    },
    {
        "title": "Day 7 — Crypto 101",
        "question": "What makes cryptocurrency different from regular money?",
        "options": ["A) It’s printed by banks", "B) It’s decentralised and not controlled by one authority", "C) It only exists as coins"],
        "correct": 1,
    },
    {
        "title": "Day 8 — Bitcoin & Ethereum",
        "question": "What is Ethereum mainly used for?",
        "options": ["A) Streaming music", "B) Running smart contracts and apps", "C) Printing NFTs"],
        "correct": 1,
    },
    {
        "title": "Day 9 — Stablecoins",
        "question": "What’s unique about stablecoins like USDC?",
        "options": ["A) They change price daily", "B) They’re tied to traditional currencies", "C) They’re only for games"],
        "correct": 1,
    },
    {
        "title": "Day 10 — Web3 Wallet Basics",
        "question": "A Web3 wallet is like:",
        "options": ["A) An email inbox", "B) Your digital passport holding assets", "C) A photo album"],
        "correct": 1,
    },
    {
        "title": "Day 11 — Wallet Security",
        "question": "What’s the golden rule for your seed phrase?",
        "options": ["A) Share it with support staff", "B) Keep it private and offline", "C) Store it in screenshots"],
        "correct": 1,
    },
    {
        "title": "Day 12 — Sending Crypto",
        "question": "When you send crypto, what happens?",
        "options": ["A) A bank approves it", "B) The blockchain network validates and records it", "C) It disappears temporarily"],
        "correct": 1,
    },
    {
        "title": "Day 13 — Signing Transactions",
        "question": "Why do you “sign” a transaction?",
        "options": ["A) To decorate it", "B) To authorise an action from your wallet", "C) To send an email"],
        "correct": 1,
    },
    {
        "title": "Day 14 — Review & Badge",
        "question": "Blockchain networks are maintained by:",
        "options": ["A) A single government agency", "B) Thousands of computers", "C) Private companies only"],
        "correct": 1,
    },
]
TOTAL = len(QUESTIONS)


async def _get_uid_by_privy(session, privy_id: str) -> int:
    uid = await session.scalar(select(User.id).where(User.privy_id == privy_id))
    if not uid:
        raise HTTPException(status_code=404, detail="User not found by privy_id")
    return uid


@router.get("/quiz/state", response_model=QuizStateResponse)
async def quiz_state(privy_id: str = Query(...)):
    today = date.today()

    async with async_session() as session:
        uid = await _get_uid_by_privy(session, privy_id)

        # ensure row exists
        row = await session.get(QuizProgress, uid)
        if not row:
            row = QuizProgress(user_id=uid, completed_index=-1, last_correct_date=None)
            session.add(row)
            await session.commit()
            await session.refresh(row)

        next_index = row.completed_index + 1
        if next_index >= TOTAL:
            return QuizStateResponse(finished=True, locked=True, index=None, total=TOTAL)

        locked = (row.last_correct_date == today)
        q = QUESTIONS[next_index]
        return QuizStateResponse(
            finished=False,
            locked=locked,
            index=next_index,
            total=TOTAL,
            title=q["title"],
            question=q["question"],
            options=q["options"],
        )


@router.post("/quiz/answer")
async def quiz_answer(payload: QuizAnswerPayload):
    today = date.today()
    async with async_session() as session:
        uid = await _get_uid_by_privy(session, payload.privy_id)
        row = await session.get(QuizProgress, uid)
        if not row:
            row = QuizProgress(user_id=uid, completed_index=-1, last_correct_date=None)
            session.add(row)
            await session.commit()
            await session.refresh(row)

        # уже отвечал сегодня — запрещаем
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
            await session.commit()

        return {
            "ok": True,
            "correct": is_correct,
            "locked": True if is_correct else False,
            "index": idx,
            "total": TOTAL,
        }
