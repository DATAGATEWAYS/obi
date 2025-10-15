import os, json, asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from web3 import Web3
from sqlalchemy import select, insert
from .db import async_session
from .models import User, UserWallet, NFTMint, QuizAnswer

AMOY_RPC_URL = os.getenv("AMOY_RPC_URL")
MINTER_PRIV  = os.getenv("MINTER_PRIVATE_KEY")
CONTRACT_ADDR= os.getenv("OBI_BADGES_ADDRESS")
ABI_PATH     = os.getenv("OBI_BADGES_ABI_PATH")

if not (AMOY_RPC_URL and MINTER_PRIV and CONTRACT_ADDR and ABI_PATH):
    raise RuntimeError("Missing chain env vars")

w3 = Web3(Web3.HTTPProvider(AMOY_RPC_URL))
acct = w3.eth.account.from_key(MINTER_PRIV)
with open(ABI_PATH, "r") as f:
    CONTRACT_ABI = json.load(f)["abi"]
contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDR), abi=CONTRACT_ABI)

router = APIRouter(prefix="/rewards", tags=["rewards"])

class MintRequest(BaseModel):
    privy_id: str = Field(..., description="Privy user id")
    day: int = Field(..., ge=1, description="Quiz day index (tokenId)")

@router.post("/mint")
async def mint_badge(payload: MintRequest):
    # 1) finding user and gis wallet
    async with async_session() as session:
        uid = await session.scalar(select(User.id).where(User.privy_id == payload.privy_id))
        if not uid:
            raise HTTPException(404, "User not found")

        addr = await session.scalar(
            select(UserWallet.address).where(UserWallet.user_id == uid).order_by(UserWallet.is_primary.desc())
        )
        if not addr:
            raise HTTPException(400, "User has no wallet")

        # 2) Check right answer for today
        answered = await session.scalar(
            select(QuizAnswer.user_id).where(
                QuizAnswer.user_id == uid,
                QuizAnswer.quiz_index == payload.day - 1
            )
        )
        if not answered:
            raise HTTPException(400, "No correct answer for this day")

        # 3) if was minting for this day
        already = await session.scalar(
            select(NFTMint.user_id).where(
                NFTMint.user_id == uid,
                NFTMint.quiz_index == payload.day - 1
            )
        )
        if already:
            raise HTTPException(400, "Badge already minted for this day")

    # 4) Mint from mint wallet
    async def _send():
        nonce = w3.eth.get_transaction_count(acct.address)
        tx = contract.functions.mintTo(Web3.to_checksum_address(addr), payload.day).build_transaction({
            "from": acct.address,
            "nonce": nonce,
            "chainId": 80002,
            "gasPrice": w3.eth.gas_price
        })
        signed = acct.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return tx_hash.hex(), receipt.status

    tx_hash, status = await asyncio.to_thread(_send)
    if status != 1:
        raise HTTPException(500, "Mint tx failed")

    # 5) Send to db
    async with async_session() as session:
        await session.execute(
            insert(NFTMint).values(user_id=uid, quiz_index=payload.day - 1, tx_hash=tx_hash)
        )
        await session.commit()

    return {"ok": True, "tx_hash": tx_hash, "address": addr, "day": payload.day}
