from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.ai_api.ai import router as ai_router
from services.ai_api.users import router as users_router
from services.ai_api.wallets import router as wallets_router

load_dotenv()

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
