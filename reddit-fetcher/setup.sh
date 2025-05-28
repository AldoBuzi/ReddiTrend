#!/bin/bash

# Set the shell environment to use the Docker daemon inside the specified Minikube cluster
eval $(minikube -p ReddiTrend-Cluster docker-env)

# Build the Reddit Fetcher Docker image
docker build -t reddit-fetcher:latest .

# Delete previous Reddit Fetcher deployment
kubectl delete deployment reddit-fetcher -n kafka

# Deploy the Reddit Fetcher to the cluster
kubectl apply -f reddit-fetcher.yaml -n kafka

# Apply Reddit API secrets to the cluster
kubectl apply -f reddit-secret.yaml -n kafka