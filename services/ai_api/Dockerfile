FROM python:3.11-slim

WORKDIR /ai_api

COPY services/ai_api /ai_api/services/ai_api
COPY services/database /ai_api/services/database
COPY services/ai_api/requirements.txt /ai_api/requirements.txt

ENV PYTHONPATH=/ai_api

RUN pip install --no-cache-dir -r /ai_api/requirements.txt

CMD ["uvicorn", "services.ai_api.main:app", "--host", "0.0.0.0", "--port", "8000"]