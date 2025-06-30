import os
import httpx

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
    "Content-Type": "application/json",
    "X-Title": "Obi",
}


async def get_deepseek_answer(question: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=OPENROUTER_API_URL,
            headers=HEADERS,
            json={
                "model": "deepseek/deepseek-r1-0528-qwen3-8b:free",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful assistant. "
                        )

                    },
                    {"role": "user", "content": question}
                ]
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
