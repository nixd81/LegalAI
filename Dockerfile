FROM python:3.10

WORKDIR /app

COPY main.py /app/main.py
COPY requirements.txt /app/requirements.txt

RUN pip install --default-timeout=100 -r /app/requirements.txt

RUN apt-get update && apt-get install -y tesseract-ocr

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
