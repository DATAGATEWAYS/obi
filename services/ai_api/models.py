from datetime import date, datetime

from pydantic import BaseModel
from sqlalchemy import BigInteger, Text, TIMESTAMP, func, ForeignKey, Boolean, UniqueConstraint, Computed, Date, \
    Integer, text, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class UsernameUpdatePayload(BaseModel):
    privy_id: str
    username: str


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
    crypto_basics: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    crypto_wallets: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    nfts: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    crypto_games: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    money_transactions: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    scam_awareness: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    exploring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    other: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")


class OnboardingPayload(BaseModel):
    privy_id: str
    username: str
    topics: dict


class UserWallet(Base):
    __tablename__ = "user_wallets"
    __table_args__ = (
        UniqueConstraint("privy_wallet_id", name="uq_user_wallets_privy_wallet_id"),
        UniqueConstraint("user_id", "chain_type", "address_lower", name="uq_user_wallets_user_chain_addr"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True,
                                         nullable=False)
    privy_wallet_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    chain_type: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    address_lower: Mapped[str] = mapped_column(Text, Computed("lower(address)", persisted=True), nullable=False)
    is_embedded: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class WalletUpsertPayload(BaseModel):
    privy_id: str
    wallet_id: str | None = None
    chain_type: str
    address: str
    is_embedded: bool = True
    is_primary: bool | None = None


class WalletDTO(BaseModel):
    id: int
    chain_type: str
    address: str
    privy_wallet_id: str | None
    is_embedded: bool
    is_primary: bool
    created_at: str


class QuizProgress(Base):
    __tablename__ = "quiz_progress"
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    completed_index: Mapped[int] = mapped_column(default=-1)  # -1 = ещё ничего не решено
    last_correct_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(),
                                            nullable=False)


class QuizStateResponse(BaseModel):
    finished: bool
    locked: bool
    index: int | None
    total: int
    title: str | None = None
    question: str | None = None
    options: list[str] | None = None
    selected_index: int | None = None
    has_unclaimed: bool = False
    has_any_badge: bool = False


class QuizAnswerPayload(BaseModel):
    privy_id: str
    option_index: int


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    answered_on: Mapped[date] = mapped_column(Date, primary_key=True)
    quiz_index: Mapped[int] = mapped_column(Integer, nullable=False)
    claimed: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    token_id: Mapped[int | None] = mapped_column(Integer)
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class NFTMint(Base):
    __tablename__ = "nft_mints"

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    quiz_index: Mapped[int] = mapped_column(primary_key=True)
    tx_hash: Mapped[str] = mapped_column(Text, nullable=False)
    minted_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

class ClaimPayload(BaseModel):
    privy_id: str
