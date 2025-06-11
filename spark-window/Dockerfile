FROM bitnami/spark:3.5.5

USER root 

RUN pip install cassandra-driver


COPY __init__.py __init__.py
COPY moving-window.py moving-window.py