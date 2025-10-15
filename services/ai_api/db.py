import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=600,
    pool_size=5,
    max_overflow=10,
    future=True,
)
async_session = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

async def ping():
    async with engine.connect() as conn:
        await conn.execute("SELECT 1")

async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session