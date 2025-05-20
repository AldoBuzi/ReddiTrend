#!/bin/bash

# Todo: Finish this and check that this works

minikube start -p ReddiTrend-Cluster

kubectl create namespace kafka

eval $(minikube -p ReddiTrend-Cluster docker-env)

ENV_VALUE = $(docker info |grep "Name")

if [ "$ENV_VALUE" != "Name: ReddiTrend-Cluster" ]; then
  echo "Condition met. Exiting."
  exit 1
fi

kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka


kubectl apply -f kraft-kafka.yaml -n kafka

kubectl apply -f kafka-topic.yaml -n kafka

kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n kafka
