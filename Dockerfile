FROM python:3.10-slim

WORKDIR /app

# Install only required OS package(s), then clean apt cache
RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first for better layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --default-timeout=100 -r /app/requirements.txt

# Copy only backend files needed at runtime
COPY main.py /app/main.py
COPY semantic_matcher.py /app/semantic_matcher.py

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
