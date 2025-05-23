FROM python:3.10

WORKDIR /app
COPY fetcher.py .
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "fetcher.py"]