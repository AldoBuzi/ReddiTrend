FROM bitnami/spark:3.5.5


# Copy your Spark script into the image
ENV PYTHONPATH "${PYTHONPATH}:/app/"
RUN pip install graphframes
COPY app/__init__.py app/__init__.py
COPY app/spark.py app/spark.py
COPY app/consumer.py  app/consumer.py
