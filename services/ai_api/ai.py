from datetime import datetime

from fastapi import APIRouter

from services.ai_api.db import async_session
from services.ai_api.models import *
from services.ai_api.deepseek_client import get_deepseek_answer
from services.database.models import QA

router = APIRouter()

@router.post("/ask")
async def ask_endpoint(payload: QuestionPayload):
    user_id = payload.user_id
    question = payload.question

    answer = await get_deepseek_answer(question)

    async with async_session() as session:
        record = QA(user_id=user_id, question=question, answer=answer, created_at=datetime.utcnow())
        session.add(record)
        await session.commit()

    return {"answer": answer}