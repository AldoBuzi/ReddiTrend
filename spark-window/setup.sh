#!/bin/bash

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "⚠️ Please source this script: 'source $0'"
  exit 1
fi

eval $(minikube -p ReddiTrend-Cluster docker-env)

kubectl delete cronjobs  spark-moving-window -n kafka 


docker build -t spark-moving-window:latest . 

kubectl apply -f moving-window.yaml -n kafka