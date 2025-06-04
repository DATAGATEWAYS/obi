import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
import httpx

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def command_start(message: types.Message):
    await message.reply("Привет! Задайте мне вопрос, и я спрошу ответ у AI.")

@dp.message()
async def handle_question(message: types.Message):
    user_id = message.from_user.id
    question = message.text.strip()
    if not question:
        return
    payload = {"user_id": user_id, "question": question}
    async with httpx.AsyncClient() as client:
        response = await client.post("http://fastapi:8000/ask", json=payload)
    if response.status_code == 200:
        answer = response.json().get("answer")
        await message.answer(answer)
    else:
        await message.answer("Извините, не смог обработать запрос.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(dp.start_polling())
