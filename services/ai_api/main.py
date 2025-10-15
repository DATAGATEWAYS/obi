from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from services.ai_api.ai import router as ai_router
from services.ai_api.db import engine
from services.ai_api.users import router as users_router
from services.ai_api.wallets import router as wallets_router
from services.ai_api.quiz import router as quiz_router


load_dotenv()

@asynccontextmanager
async def lifespan():
    # --- startup ---
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    # --- shutdown ---
    await engine.dispose()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://obi-sigma.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(ai_router)
app.include_router(wallets_router)
app.include_router(quiz_router)
