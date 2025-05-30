#!/bin/bash

eval $(minikube -p ReddiTrend-Cluster docker-env)

docker build -t fastapi-backend .

kubectl delete deployment fastapi-backend -n kafka

kubectl apply -f fastapi-backend.yaml -n kafka