FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY connection.py .
COPY models.py .
COPY top_nodes_and_edges.json .

