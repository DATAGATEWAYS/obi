import asyncio
import json
import os

from fastapi import HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from web3 import Web3
from web3.exceptions import ContractLogicError

from services.ai_api.db import async_session, get_session
from services.ai_api.models import UserWallet

_RPC_URL = os.getenv("AMOY_RPC_URL") or os.getenv("RPC_URL")
_CONTRACT_ADDR = os.getenv("OBI_BADGES_ADDRESS")
_CHAIN_ID = int(os.getenv("CHAIN_ID_TEST", "80002"))
_PRIVKEY = (os.getenv("MINTER_PRIVATE_KEY") or "").strip()

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


async def _mint_sync(to_addr: str, token_id: int) -> str:
    if not (_w3 and _contract and _minter):
        raise RuntimeError("Web3/contract/minter is not configured")

    to = Web3.to_checksum_address(to_addr)
    nonce = _w3.eth.get_transaction_count(_minter.address)
    gas_price = _w3.eth.gas_price

    tx_func = None
    try:
        # mint(address,uint256,uint256,bytes)
        tx_func = _contract.functions.mint(to, int(token_id), 1, b"")
        _ = tx_func.estimate_gas({"from": _minter.address})
    except Exception:
        try:
            # mint(address,uint256)
            tx_func = _contract.functions.mint(to, int(token_id))
            _ = tx_func.estimate_gas({"from": _minter.address})
        except Exception:
            try:
                # mintTo(address,uint256)
                tx_func = _contract.functions.mintTo(to, int(token_id))
                _ = tx_func.estimate_gas({"from": _minter.address})
            except Exception as e:
                raise RuntimeError(f"No suitable mint method in ABI for token {token_id}: {e}")

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
    tx_hash = _w3.eth.send_raw_transaction(signed.rawTransaction)
    # waiting for approval:
    _w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
    return tx_hash.hex()


async def mint_badge_to_wallet(user_id: int, token_id: int, session: AsyncSession = Depends(get_session)) -> str:
    addr = await session.scalar(
        select(UserWallet.address)
        .where(UserWallet.user_id == user_id)
        .order_by(UserWallet.is_primary.desc(), UserWallet.created_at.asc())
    )

    if not addr:
        raise HTTPException(status_code=400, detail="user_has_no_wallet")

    loop = asyncio.get_running_loop()
    try:
        tx_hash = await loop.run_in_executor(None, _mint_sync, addr, token_id)
        return tx_hash
    except ContractLogicError as e:
        raise HTTPException(status_code=400, detail=f"mint_failed:{str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint_error:{str(e)}")


async def mint_badge(to_addr: str, token_id: int) -> str:
    loop = asyncio.get_running_loop()
    try:
        tx_hash = await loop.run_in_executor(None, _mint_sync, to_addr, int(token_id))
        return tx_hash
    except ContractLogicError as e:
        raise HTTPException(status_code=400, detail=f"mint_failed:{e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint_error:{e}")
