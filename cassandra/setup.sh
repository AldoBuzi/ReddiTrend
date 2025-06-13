#!/bin/bash


#if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
#  echo "⚠️ Please source this script: 'source $0'"
 # exit 1
#fi

#eval $(minikube -p ReddiTrend-Cluster docker-env)

kubectl delete deployment cassandra -n redditrend

kubectl wait --for=condition=ready pod -l app=cassandra -n redditrend --timeout=300s

kubectl delete job cassandra-init -n redditrend --ignore-not-found

kubectl delete configmap cassandra-schema -n redditrend

# Deploy Cassandra to the cluster
kubectl apply -f cassandra.yaml -n redditrend

kubectl wait --for=condition=ready pod -l app=cassandra -n redditrend --timeout=300s

# Ceate the ConfigMap for the schema
kubectl create configmap cassandra-schema --from-file=schema.cql -n redditrend

sleep 1

# Deploy the schema initialization
kubectl apply -f cassandra-init.yaml -n redditrend

echo "Waiting for cassandra-init job to complete..."

kubectl wait --for=condition=complete job/cassandra-init -n redditrend --timeout=300s || {
  echo "Job did not complete in time"
  exit 1
}

echo "Schema initialization completed!"