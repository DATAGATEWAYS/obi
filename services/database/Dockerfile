FROM python:3.11-slim
WORKDIR /database
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "init_db.py"]