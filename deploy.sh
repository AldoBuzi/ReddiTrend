#!/bin/bash

set -e  # stop if any script fails

kubectl create namespace redditrend

kubectl create -f 'https://strimzi.io/install/latest?namespace=redditrend' -n redditrend

sleep 1

echo "Waiting for Strimzi operator to be ready..."
kubectl wait deployment/strimzi-cluster-operator \
  --namespace=redditrend \
  --for=condition=Available \
  --timeout=120s

kubectl apply -f kafka/kraft-kafka.yaml -n redditrend

sleep 1

kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n redditrend

sleep 1

kubectl apply -f spark-rbac.yaml -n redditrend

sleep 1

kubectl apply -f kafka/kafka-topic.yaml -n redditrend


kubectl apply -f metrics-server/components.yaml -n redditrend


echo "Starting Cassandra deployment..."
./cassandra/setup.sh

echo "Starting Reddit Fetcher deployment..."
./reddit-fetcher/setup.sh

echo "Starting Spark consumer deployment..."
./spark-consumer/apply-changes.sh

echo "Starting Spark Top Nodes deployment..."
./spark/setup.sh

echo "Starting Spark Moving Window deployment..."
./spark-window/setup.sh


echo "Starting Backend deployment..."
./backend/setup.sh

echo "Starting Frontend deployment..."
./redditrend/setup.sh

echo "All deployments executed successfully!"
