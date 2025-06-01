#!/bin/bash

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "⚠️ Please source this script: 'source $0'"
  exit 1
fi

eval $(minikube -p ReddiTrend-Cluster docker-env)

kubectl delete cronjobs  spark-top-nodes-precompute -n kafka 


docker build -t spark-top-nodes:latest . 

kubectl apply -f spark-precompute.yaml -n kafka