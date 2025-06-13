#!/bin/bash
#if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
 # echo "⚠️ Please source this script: 'source $0'"
  #exit 1
#fi
# Set the shell environment to use the Docker daemon inside the specified Minikube cluster
#eval $(minikube -p ReddiTrend-Cluster docker-env)

# Build the Reddit Fetcher Docker image
#docker build -t reddit-fetcher:latest .

# Delete previous Reddit Fetcher deployment
kubectl delete deployment reddit-fetcher -n redditrend

POD_NAME=$(kubectl get pods -n redditrend | grep reddit-fetcher | awk '{print $1}')
kubectl wait --for=delete pod/"$POD_NAME" -n redditrend --timeout=60s

# Deploy the Reddit Fetcher to the cluster
kubectl apply -f reddit-fetcher.yaml -n redditrend

# Apply Reddit API secrets to the cluster
kubectl apply -f reddit-secret.yaml -n redditrend

echo "Created Reddit-Fetcher"