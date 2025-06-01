#!/bin/bash


if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "⚠️ Please source this script: 'source $0'"
  exit 1
fi

eval $(minikube -p ReddiTrend-Cluster docker-env)

kubectl delete deployment cassandra -n kafka

kubectl wait --for=condition=ready pod -l app=cassandra -n kafka --timeout=300s

kubectl delete job cassandra-init -n kafka --ignore-not-found

kubectl delete configmap cassandra-schema -n kafka

# Deploy Cassandra to the cluster
kubectl apply -f cassandra.yaml -n kafka

kubectl wait --for=condition=ready pod -l app=cassandra -n kafka --timeout=300s

# Ceate the ConfigMap for the schema
kubectl create configmap cassandra-schema --from-file=schema.cql -n kafka

sleep 1

# Deploy the schema initialization
kubectl apply -f cassandra-init.yaml -n kafka