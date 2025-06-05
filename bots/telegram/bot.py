import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
import httpx

MAX_MSG_LEN = 4096


async def send_message(message, text):
    if len(text) > MAX_MSG_LEN:
        for i in range(0, len(text), MAX_MSG_LEN):
            await message.answer(text[i:i + MAX_MSG_LEN], parse_mode="HTML")
    else:
        await message.answer(text, parse_mode="HTML")


import re


def markdown_list_to_numbered_and_bullets(text: str) -> str:
    lines = text.splitlines()
    num = 1
    result = []
    for line in lines:
        m = re.match(r'^([ \t]*)-\s+(.*)', line)
        if m:
            spaces = m.group(1)
            content = m.group(2)
            level = (len(spaces) // 2)
            if level == 0:
                prefix = f"{num}. "
                num += 1
            else:
                n_spaces = 2 ** level + (level if level > 1 else 0)
                prefix = ' ' * n_spaces + '• '
            result.append(prefix + content)
        else:
            result.append(line)
            num = 1
    return '\n'.join(result)


def markdown_table_to_text(md_table: str) -> str:
    lines = [line.strip() for line in md_table.strip().split('\n') if line.strip()]
    headers = [h.strip(' *') for h in lines[0].strip('|').split('|')]
    result = []
    for row in lines[2:]:
        cols = [c.strip() for c in row.strip('|').split('|')]
        section = f'<b>{cols[0]}</b>\n'
        for h, c in zip(headers[1:], cols[1:]):
            section += f'    <b>{h}:</b> {c}\n'
        result.append(section)
    return '\n'.join(result)


def process_markdown_tables(text: str) -> str:
    table_pattern = re.compile(
        r'((?:^\|.*\|\s*\n)+^\|[\s\-:|]+\|\s*\n(?:^\|.*\|\s*\n?)+)', re.MULTILINE)

    def replace_table(match):
        md_table = match.group(1)
        return '\n' + markdown_table_to_text(md_table) + '\n'

    return table_pattern.sub(replace_table, text)


def add_blank_lines_to_lists(text: str) -> str:
    text = re.sub(r'^(\d+\..+)', r'\1\n', text, flags=re.MULTILINE)
    text = re.sub(r'^([•*]\s.+)', r'\1\n', text, flags=re.MULTILINE)
    return text


def markdown_to_telegram_html(text: str) -> str:
    # Add a blank line after each list item (numbered or * or •)
    text = add_blank_lines_to_lists(text)
    # 0. Preprocess markdown tables (replace them with readable text)
    text = process_markdown_tables(text)
    # 1. Lists
    text = markdown_list_to_numbered_and_bullets(text)
    # 2. Replace asterisks at start of lines with bullets for lists
    text = re.sub(r'^[ \t]*\*\s+', '• ', text, flags=re.MULTILINE)
    # 3. Multiline code blocks with language
    text = re.sub(
        r'```(\w+)\n(.*?)```',
        r'<pre><code class="language-\1">\2</code></pre>',
        text,
        flags=re.DOTALL
    )
    # 4. Bold+Italic (***text***)
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'<b><i>\1</i></b>', text)
    # 5. Bold (**text**)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # 6. Italic (*text*)
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    # 7. Strikethrough
    text = re.sub(r'~~(.+?)~~', r'<s>\1</s>', text)
    # 8. Underline
    text = re.sub(r'__(.+?)__', r'<u>\1</u>', text)
    # 9. Links
    text = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', text)
    # 10. Headers
    text = re.sub(r'^### (.+)$', r'<b>\1</b>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.+)$', r'<b>\1</b>', text, flags=re.MULTILINE)
    text = re.sub(r'^# (.+)$', r'<b>\1</b>', text, flags=re.MULTILINE)
    # 11. Inline code
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return text


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
        answer = markdown_to_telegram_html(answer)
        await send_message(message, answer)
    else:
        await message.answer("Sorry, I couldn’t process the request.", parse_mode="HTML")


if __name__ == "__main__":
    import asyncio

    asyncio.run(dp.start_polling(bot))
