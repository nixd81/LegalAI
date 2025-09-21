# backend/Dockerfile
FROM python:3.10

WORKDIR /app

COPY main.py /app/main.py

RUN pip install --default-timeout=100 fastapi uvicorn PyPDF2 python-docx pytesseract pillow python-multipart

# You might also need to install Tesseract-OCR for image extraction
RUN apt-get update && apt-get install -y tesseract-ocr

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
