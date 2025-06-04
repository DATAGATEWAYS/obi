from openai import OpenAI

async def get_deepseek_answer(question: str) -> str:
    client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"),
                    base_url="https://api.deepseek.com")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": question}
        ]
    )
    return response.choices[0].message.content
