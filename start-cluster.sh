#!/bin/bash

# Todo: Finish this and check that this works

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "⚠️ Please source this script: 'source $0'"
  exit 1
fi

minikube start -p ReddiTrend-Cluster --memory=15400 --cpus=4

kubectl create namespace redditrend

eval $(minikube -p ReddiTrend-Cluster docker-env)

ENV_VALUE=$(docker info |grep "Name")


if [ "$ENV_VALUE" != " Name: ReddiTrend-Cluster" ]; then
  echo "Condition met. Exiting."
  exit 1
fi

kubectl create -f 'https://strimzi.io/install/latest?namespace=redditrend' -n kafka

sleep 1

kubectl apply -f kafka/kraft-kafka.yaml -n redditrend

sleep 1

kubectl apply -f spark-rbac.yaml -n redditrend

sleep 1

kubectl apply -f kafka/kafka-topic.yaml -n redditrend

sleep 1

kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n redditrend

kubectl apply -f metrics-server/components.yaml -n redditrend

eval $(minikube -p ReddiTrend-Cluster docker-env)