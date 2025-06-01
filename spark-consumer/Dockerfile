FROM bitnami/spark:3.5.5

# Install useradd
USER root

# Ensure necessary utilities are available
RUN apt-get update && apt-get install -y passwd

# Create user and group explicitly
RUN groupadd -g 1001 spark && useradd -u 1001 -g spark -m -s /bin/bash spark
RUN mkdir -p /app && chown -R spark:spark /app /tmp
USER spark

ENV PYTHONPATH "${PYTHONPATH}:/app/"
