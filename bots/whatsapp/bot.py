import os
import re

import httpx
import requests
from aiohttp import payload
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse

app = FastAPI()

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

MAX_MSG_LEN = 4096


@app.get("/")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        return PlainTextResponse(content=challenge)
    return JSONResponse(status_code=403, content={"error": "Verification failed"})


@app.post("/")
async def receive_message(request: Request):
    data = await request.json()
    print("📩 Incoming data:", data)

    try:
        entry = data['entry'][0]
        changes = entry['changes'][0]
        value = changes['value']

        if 'messages' in value:
            message = value['messages'][0]
            from_number = message['from']
            msg_text = message['text']['body']

            print(f"✅ New message from {from_number}: {msg_text}")

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post("http://ai_api:8000/ask", json=payload)
                    response.raise_for_status()
                    answer = response.json().get("answer")
                    answer = markdown_list_to_whatsapp(answer)
                    await send_message(from_number, answer)
            except Exception as e:
                await message.answer(
                    f"Sorry, I couldn’t process the request.\nError: {e}",
                    parse_mode="HTML"
                )

    except Exception as e:
        print("❌ Error with message:", e)

    return JSONResponse(status_code=200, content={"status": "received"})


async def send_whatsapp_reply(to: str, text: str):
    url = f"https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {
            "body": text
        }
    }

    response = requests.post(url, json=payload, headers=headers)
    print("📤 Message sent:", response.status_code, response.text)


async def send_message(from_number, text):
    if len(text) > MAX_MSG_LEN:
        for i in range(0, len(text), MAX_MSG_LEN):
            await send_whatsapp_reply(from_number, f"{text[i:i + MAX_MSG_LEN]}")
    else:
        await send_whatsapp_reply(from_number, f"{text}")


def markdown_list_to_whatsapp(text: str) -> str:
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


def markdown_table_to_whatsapp(md_table: str) -> str:
    lines = [line.strip() for line in md_table.strip().split('\n') if line.strip()]
    headers = [h.strip(' *') for h in lines[0].strip('|').split('|')]
    result = []
    for row in lines[2:]:
        cols = [c.strip() for c in row.strip('|').split('|')]
        section = f"*{cols[0]}*\n"
        for h, c in zip(headers[1:], cols[1:]):
            section += f'  _{h}_: {c}\n'
        result.append(section)
    return '\n'.join(result)


def process_markdown_tables_for_whatsapp(text: str) -> str:
    table_pattern = re.compile(
        r'((?:^\|.*\|\s*\n)+^\|[\s\-:|]+\|\s*\n(?:^\|.*\|\s*\n?)+)', re.MULTILINE)

    def replace_table(match):
        md_table = match.group(1)
        return '\n' + markdown_table_to_whatsapp(md_table) + '\n'

    return table_pattern.sub(replace_table, text)


def markdown_to_whatsapp(text: str) -> str:
    # 0. Tables
    text = process_markdown_tables_for_whatsapp(text)
    # 1. Lists
    text = markdown_list_to_whatsapp(text)
    text = re.sub(r'^[ \t]*\*\s+', '• ', text, flags=re.MULTILINE)
    # 2. Bold+Italic (***text***)
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'*\_\1\_*', text)
    # 3. Bold (**text**)
    text = re.sub(r'\*\*(.+?)\*\*', r'*\1*', text)
    # 4. Italic (*text*)
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'_\1_', text)
    # 5. Strikethrough
    text = re.sub(r'~~(.+?)~~', r'~\1~', text)
    # 6. Inline code
    text = re.sub(r'`([^`]+)`', r'`\1`', text)
    # 7. Headers
    text = re.sub(r'^### (.+)$', r'*_\1_*', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.+)$', r'*\1*', text, flags=re.MULTILINE)
    text = re.sub(r'^# (.+)$', r'* \1 *', text, flags=re.MULTILINE)
    # 8. Links: [text](url) → text (url)
    text = re.sub(r'\[(.+?)\]\((.+?)\)', r'\1 (\2)', text)
    return text
