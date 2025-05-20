#!/bin/bash

# Delete existing Spark Kafka consumer job if it exists
kubectl delete job spark-kafka-consumer -n kafka --ignore-not-found
POD_NAME=$(kubectl get pods -n kafka | grep spark-kafka-consumer | awk '{print $1}')
kubectl wait --for=delete pod/"$POD_NAME" -n kafka --timeout=60s

# Build the Docker image
docker build -t reddit-spark-consumer:latest .

# Apply the Kubernetes job definition
kubectl apply -f spark-consumer.yaml

POD_NAME=$(kubectl get pods -n kafka | grep spark-kafka-consumer | awk '{print $1}')
kubectl wait pod/"$POD_NAME" --for=condition=Ready --timeout=300s -n kafka

# Stream the logs from the job
kubectl logs -f job/spark-kafka-consumer -n kafka
