#!/bin/bash

# Deploy Cassandra to the cluster
kubectl apply -f cassandra.yaml -n kafka

# Ceate the ConfigMap for the schema
kubectl create configmap cassandra-schema --from-file=schema.cql -n kafka

# Deploy the schema initialization
kubectl apply -f cassandra-init.yaml