import os
from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import CommandStart
import httpx
import asyncio
import contextlib

MAX_MSG_LEN = 4096


async def send_message(message, text):
    if len(text) > MAX_MSG_LEN:
        for i in range(0, len(text), MAX_MSG_LEN):
            await message.answer(text[i:i + MAX_MSG_LEN], parse_mode="HTML")
    else:
        await message.answer(text, parse_mode="HTML")


async def typing_indicator(chat):
    try:
        while True:
            await chat.do("typing")
            await asyncio.sleep(2)
    except asyncio.CancelledError:
        pass


TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL")
bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def on_start(message: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="Open app",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]])
    await message.answer(
        "Press the button to open the app 👇",
        reply_markup=kb
    )

async def on_startup():
    await bot.set_chat_menu_button(
        menu_button=types.MenuButtonWebApp(
            text="Profile",
            web_app=types.WebAppInfo(url=WEBAPP_URL)
        )
    )


@dp.message()
async def handle_question(message: types.Message):
    typing_task = asyncio.create_task(typing_indicator(message.chat))
    try:
        user_id = message.from_user.id
        question = message.text.strip()
        if not question:
            return
        payload = {"user_id": user_id, "question": question}
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post("http://ai_api:8000/ask")
                response.raise_for_status()
                await send_message(message, str(response))
        except Exception as e:
            await message.answer(
                f"Sorry, I couldn’t process the request.\nError: {e}",
                parse_mode="HTML"
            )
    finally:
        typing_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await typing_task


if __name__ == "__main__":
    asyncio.run(dp.start_polling(bot))
