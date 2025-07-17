import os
import requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse

app = FastAPI()

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")


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

            send_whatsapp_reply(from_number, f"Obi read: {msg_text}")

    except Exception as e:
        print("❌ Error with message:", e)

    return JSONResponse(status_code=200, content={"status": "received"})


def send_whatsapp_reply(to: str, text: str):
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