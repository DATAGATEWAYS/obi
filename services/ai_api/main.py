import os
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from services.ai_api.deepseek_client import get_deepseek_answer
from services.database.models import QA

load_dotenv()

class QuestionPayload(BaseModel):
    user_id: int
    question: str

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@app.post("/ask")
async def ask_endpoint(payload: QuestionPayload):
    user_id = payload.user_id
    question = payload.question

    answer = await get_deepseek_answer(question)

    async with async_session() as session:
        record = QA(user_id=user_id, question=question, answer=answer, created_at=datetime.utcnow())
        session.add(record)
        await session.commit()

    return {"answer": answer}
