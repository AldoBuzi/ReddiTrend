FROM bitnami/spark:3.5.5

USER root

# Copy your Spark script into the image
RUN pip install graphframes
RUN pip install keybert
RUN pip install cassandra-driver
#RUN pip install pandas

#RUN pip install vaderSentiment

#RUN pip install spark-nlp==6.0.2

COPY __init__.py app/__init__.p
COPY spark.py app/spark.py
COPY schema.py app/schema.py
COPY graph.py app/graph.py
COPY consumer.py  app/consumer.py