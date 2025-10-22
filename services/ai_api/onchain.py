import asyncio
import json
import os

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from web3 import Web3
from web3.exceptions import ContractLogicError

from services.ai_api.models import UserWallet

import threading
import time

_RPC_URL = os.getenv("AMOY_RPC_URL")
_CONTRACT_ADDR = os.getenv("OBI_BADGES_ADDRESS")
_CHAIN_ID = int(os.getenv("CHAIN_ID_TEST"))
_PRIVKEY = os.getenv("MINTER_PRIVATE_KEY")

_abi_path = os.getenv("OBI_BADGES_ABI_PATH")
_abi = None
if _abi_path:
    with open(_abi_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict) and "abi" in data:
        _abi = data["abi"]
    elif isinstance(data, list):
        _abi = data
    else:
        raise RuntimeError("ABI file must be a Hardhat artifact {abi:[...]} or a plain ABI array")

_w3 = Web3(Web3.HTTPProvider(_RPC_URL)) if _RPC_URL else None
_contract = (
    _w3.eth.contract(address=Web3.to_checksum_address(_CONTRACT_ADDR), abi=_abi)
    if (_w3 and _CONTRACT_ADDR and _abi) else None
)
_minter = (_w3.eth.account.from_key(_PRIVKEY) if (_w3 and _PRIVKEY) else None)

_nonce_lock = threading.Lock()

print("[onchain] _minter:", _minter)
print("[onchain] _w3:", _w3)

if _w3 and _minter:
    try:
        bal = _w3.eth.get_balance(_minter.address)
        print("[onchain] RPC:", _RPC_URL, "chain:", _CHAIN_ID)
        print("[onchain] MINTER:", _minter.address, "balance:", Web3.from_wei(bal, "ether"), "MATIC")
    except Exception as e:
        print("[onchain] init check failed:", e)


def get_onchain_status():
    if not (_w3 and _contract and _minter):
        return {"ready": False}
    bal = _w3.eth.get_balance(_minter.address)
    nonce = _w3.eth.get_transaction_count(_minter.address, "pending")
    return {
        "ready": True, "rpc": _RPC_URL, "chain_id": _CHAIN_ID,
        "contract": _CONTRACT_ADDR, "minter_address": _minter.address,
        "minter_balance_matic": float(Web3.from_wei(bal, "ether")),
        "next_nonce": int(nonce),
    }


def _mint_sync(to_addr: str, token_id: int) -> str:
    if not (_w3 and _contract and _minter):
        raise RuntimeError("Web3/contract/minter is not configured")

    to = Web3.to_checksum_address(to_addr)
    tx_func = _contract.functions.mintTo(to, int(token_id))
    try:
        _ = tx_func.estimate_gas({"from": _minter.address})
    except Exception:
        tx_func = _contract.functions.mint(to, int(token_id), 1, b"")

    last_err = None
    for _ in range(3):
        with _nonce_lock:
            nonce = _w3.eth.get_transaction_count(_minter.address, "pending")
            gas_price = _w3.eth.gas_price
            tx = tx_func.build_transaction({
                "from": _minter.address,
                "nonce": nonce,
                "chainId": _CHAIN_ID,
                "gasPrice": gas_price,
            })
            if "gas" not in tx:
                try:
                    tx["gas"] = _w3.eth.estimate_gas(tx)
                except Exception:
                    tx["gas"] = 250_000

            signed = _w3.eth.account.sign_transaction(tx, private_key=_PRIVKEY)

        try:
            tx_hash = _w3.eth.send_raw_transaction(signed.raw_transaction)
            _w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
            return tx_hash.hex()
        except ValueError as e:
            msg = str(e)
            last_err = e
            if "nonce too low" in msg or "replacement" in msg:
                time.sleep(1.0)
                continue
            if "insufficient funds" in msg:
                raise
            raise
    raise last_err


async def mint_badge_to_wallet(session: AsyncSession, user_id: int, token_id: int) -> str:
    addr = await session.scalar(
        select(UserWallet.address)
        .where(UserWallet.user_id == user_id)
        .order_by(UserWallet.is_primary.desc(), UserWallet.created_at.asc())
    )
    if not addr:
        raise HTTPException(status_code=400, detail="user_has_no_wallet")

    loop = asyncio.get_running_loop()
    try:
        tx_hash = await loop.run_in_executor(None, _mint_sync, addr, int(token_id))
        return tx_hash
    except ContractLogicError as e:
        raise HTTPException(status_code=400, detail=f"mint_failed:{e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint_error:{e}")


async def mint_badge(to_addr: str, token_id: int) -> str:
    loop = asyncio.get_running_loop()
    try:
        tx_hash = await loop.run_in_executor(None, _mint_sync, to_addr, int(token_id))
        return tx_hash
    except ContractLogicError as e:
        raise HTTPException(status_code=400, detail=f"mint_failed:{e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint_error:{e}")
