from pydantic import BaseModel
from sqlalchemy import BigInteger, Text, TIMESTAMP, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class QuestionPayload(BaseModel):
    user_id: int
    question: str

class UserInsertPayload(BaseModel):
    telegram_id: int
    privy_id: str | None = None

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    privy_id: Mapped[str | None] = mapped_column(Text, nullable=True, unique=False)
    reg_date: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)