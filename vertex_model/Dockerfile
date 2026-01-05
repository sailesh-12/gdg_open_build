FROM python:3.9-slim

WORKDIR /app

# Create a temp directory inside the container to avoid I/O errors
ENV TMPDIR=/app/tmp
RUN mkdir -p /app/tmp

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --timeout=120 -r requirements.txt && \
    rm -rf /app/tmp

COPY app.py .
COPY fragility_model.pkl .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
