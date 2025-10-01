from pydantic import BaseModel
from sqlalchemy import BigInteger, Text, TIMESTAMP, func, ForeignKey, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class QuestionPayload(BaseModel):
    user_id: int
    question: str

class UserInsertPayload(BaseModel):
    telegram_username: str | None = None
    telegram_id: int
    privy_id: str | None = None

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    telegram_username: Mapped[str | None] = mapped_column(Text, nullable=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    privy_id: Mapped[str | None] = mapped_column(Text, nullable=True, index=True)
    reg_date: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class Username(Base):
    __tablename__ = "usernames"
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    username: Mapped[str] = mapped_column(Text, nullable=False)

class UserTopics(Base):
    __tablename__ = "user_topics"
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    crypto_basics:      Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    crypto_wallets:     Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    nfts:               Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    crypto_games:       Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    money_transactions: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    scam_awareness:     Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    exploring:          Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    other:              Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

class OnboardingPayload(BaseModel):
    telegram_id: int
    username: str
    topics: dict