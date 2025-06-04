FROM python:3.11-slim
WORKDIR /app
COPY services /app/services
ENV PYTHONPATH=/app
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "init_db.py"]