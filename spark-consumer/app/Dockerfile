FROM bitnami/spark:3.5.5


# Install useradd
USER root

# Ensure necessary utilities are available
RUN apt-get update && apt-get install -y passwd

# Create user and group explicitly
RUN groupadd -g 1001 spark && useradd -u 1001 -g spark -m -s /bin/bash spark
RUN mkdir -p /app && chown -R spark:spark /app /tmp

ENV PYTHONPATH "${PYTHONPATH}:/app/"

# Copy your Spark script into the image
RUN pip install graphframes
RUN pip install keybert
RUN pip install cassandra-driver
RUN pip install vaderSentiment

USER root


#RUN pip install spark-nlp==6.0.2

COPY __init__.py app/__init__.p
COPY spark.py app/spark.py
COPY schema.py app/schema.py
COPY graph.py app/graph.py
COPY consumer.py  app/consumer.py
COPY cassandra_connector.py app/cassandra_connector.py
COPY utilities_consumer.py app/utilities_consumer.py