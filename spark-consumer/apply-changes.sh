#!/bin/bash

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "⚠️ Please source this script: 'source $0'"
  exit 1
fi


eval $(minikube -p ReddiTrend-Cluster docker-env)

# Delete existing Spark Kafka consumer job if it exists
kubectl delete pod spark-kafka-consumer -n kafka --ignore-not-found
POD_NAME=$(kubectl get pods -n kafka | grep spark-kafka-consumer | awk '{print $1}')
kubectl wait --for=delete pod/"$POD_NAME" -n kafka --timeout=60s

kubectl delete pod -n kafka -l spark-role=driver --ignore-not-found
kubectl wait --for=delete pod -l spark-role=driver -n kafka --timeout=60s

# Build the Docker image
docker build -t reddit-spark-consumer:latest .

docker build -t spark-launcher:latest ./app

# Apply the Kubernetes job definition
kubectl apply -f spark-consumer.yaml

POD_NAME=$(kubectl get pods -n kafka | grep spark-kafka-consumer | awk '{print $1}')
kubectl wait pod/"$POD_NAME" --for=condition=Ready --timeout=300s -n kafka

# Stream the logs from the job
kubectl logs -f pod/spark-kafka-consumer -n kafka
