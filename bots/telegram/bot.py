import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
import httpx

MAX_MSG_LEN = 4096


async def send_message(message, text):
    if len(text) > MAX_MSG_LEN:
        for i in range(0, len(text), MAX_MSG_LEN):
            await message.answer(text[i:i + MAX_MSG_LEN], parse_mode="Markdown")
    else:
        await message.answer(text, parse_mode="Markdown")


TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
bot = Bot(token=TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def command_start(message: types.Message):
    await message.reply("Hello! Ask me any question, and I’ll get the answer from AI.")


@dp.message()
async def handle_question(message: types.Message):
    await message.chat.do("typing")

    user_id = message.from_user.id
    question = message.text.strip()
    if not question:
        return
    payload = {"user_id": user_id, "question": question}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post("http://ai_api:8000/ask", json=payload)
    if response.status_code == 200:
        answer = response.json().get("answer")
        await send_message(message, answer)
    else:
        await message.answer("Sorry, I couldn’t process the request.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(dp.start_polling(bot))
