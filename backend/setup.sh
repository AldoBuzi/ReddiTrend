#!/bin/bash

#if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
 # echo "⚠️ Please source this script: 'source $0'"
  #exit 1
#fi

#eval $(minikube -p ReddiTrend-Cluster docker-env)

#docker build -t fastapi-backend .

kubectl delete deployment fastapi-backend -n redditrend

POD_NAME=$(kubectl get pods -n redditrend | grep fastapi-backend | awk '{print $1}')
kubectl wait --for=delete pod/"$POD_NAME" -n redditrend --timeout=60s

kubectl apply -f fastapi-backend.yaml -n redditrend