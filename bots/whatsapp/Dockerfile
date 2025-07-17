FROM python:3.11-slim

WORKDIR /whatsapp

COPY services/ai_api /ai_api/services/ai_api
COPY bots/whatsapp /whatsapp/bots/whatsapp

COPY bots/whatsapp/requirements.txt /whatsapp/requirements.txt

ENV PYTHONPATH=/whatsapp

RUN pip install --no-cache-dir -r /whatsapp/requirements.txt

CMD ["uvicorn", "bots.whatsapp.bot:app", "--host", "0.0.0.0", "--port", "8001"]