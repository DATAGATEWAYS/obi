FROM python:3.11-slim

WORKDIR /app

COPY services/ai_api /app/services/ai_api
COPY services/database /app/services/database
COPY services/ai_api/requirements.txt /app/requirements.txt

ENV PYTHONPATH=/app

RUN pip install --no-cache-dir -r /app/requirements.txt

CMD ["uvicorn", "services.ai_api.main:app", "--host", "0.0.0.0", "--port", "8000"]