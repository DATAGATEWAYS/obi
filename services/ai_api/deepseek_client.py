# import os
# from openai import OpenAI
#
# async def get_deepseek_answer(question: str) -> str:
#     client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"),
#                     base_url="https://api.deepseek.com")
#     response = client.chat.completions.create(
#         model="deepseek-chat",
#         messages=[
#             {"role": "system", "content": "You are a helpful assistant."},
#             {"role": "user", "content": question}
#         ]
#     )
#     return response.choices[0].message.content
#
# import os
# import httpx
#
# API_URL = "https://api.deepseek.com/v1/chat/completions"
# API_KEY = os.getenv("DEEPSEEK_API_KEY")
#
#
# async def get_deepseek_answer(question: str) -> str:
#     if not API_KEY:
#         raise ValueError("DEEPSEEK_API_KEY not set in environment variables")
#
#     headers = {
#         "Authorization": f"Bearer {API_KEY}",
#         "Content-Type": "application/json",
#     }
#
#     payload = {
#         "model": "deepseek-chat",
#         "messages": [{"role": "system", "content": "You are a helpful assistant."},{"role": "user", "content": question}],
#     }
#
#     async with httpx.AsyncClient() as client:
#         response = await client.post(API_URL, headers=headers, json=payload)
#         response.raise_for_status()
#         data = response.json()
#         return data["choices"][0]["message"]["content"]

import os
import httpx

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
    "Content-Type": "application/json",
    "X-Title": "YourAppName",  # необязательное поле
}

async def get_deepseek_answer(question: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=OPENROUTER_API_URL,
            headers=HEADERS,
            json={
                "model": "deepseek/deepseek-r1-0528-qwen3-8b:free",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": question}
                ]
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


