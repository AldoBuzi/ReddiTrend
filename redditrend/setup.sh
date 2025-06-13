#!/bin/bash

#eval $(minikube -p ReddiTrend-Cluster docker-env)

#docker build -t react-app .

kubectl delete deployment react-app -n redditrend

kubectl apply -f react-app.yaml -n redditrend