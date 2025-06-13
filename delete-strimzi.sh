#!/bin/bash
set -e

NAMESPACE="redditrend"  # Adjust if needed

echo "Deleting Strimzi Kafka custom resources and namespace..."

# Delete Kafka custom resources in the namespace
kubectl delete kafka --all -n $NAMESPACE --ignore-not-found
kubectl delete kafkatopic --all -n $NAMESPACE --ignore-not-found
kubectl delete kafkauser --all -n $NAMESPACE --ignore-not-found
kubectl delete kafkaconnect --all -n $NAMESPACE --ignore-not-found
kubectl delete kafkaconnectors --all -n $NAMESPACE --ignore-not-found
kubectl delete kafkamirrormaker --all -n $NAMESPACE --ignore-not-found
kubectl delete kafkabridge --all -n $NAMESPACE --ignore-not-found
kubectl delete kafkauser --all -n $NAMESPACE --ignore-not-found

# Delete Strimzi namespace
kubectl delete namespace $NAMESPACE --ignore-not-found

echo "Deleting Strimzi ClusterRoleBindings and ClusterRoles..."

# Delete Strimzi ClusterRoleBindings and ClusterRoles
kubectl delete clusterrolebinding strimzi-cluster-operator --ignore-not-found
kubectl delete clusterrolebinding strimzi-cluster-operator-kafka-broker-delegation --ignore-not-found
kubectl delete clusterrolebinding strimzi-cluster-operator-kafka-client-delegation --ignore-not-found
kubectl delete clusterrole strimzi-cluster-operator-namespaced --ignore-not-found
kubectl delete clusterrole strimzi-cluster-operator-global --ignore-not-found
kubectl delete clusterrole strimzi-cluster-operator-watched --ignore-not-found
kubectl delete clusterrole strimzi-kafka-broker --ignore-not-found
kubectl delete clusterrole strimzi-kafka-client --ignore-not-found
kubectl delete clusterrole strimzi-entity-operator --ignore-not-found
kubectl delete clusterrole strimzi-cluster-operator-leader-election --ignore-not-found

echo "Deleting Strimzi CustomResourceDefinitions..."

# List of Strimzi CRDs to delete (adjust if needed)
CRDS=(
  kafkas.kafka.strimzi.io
  kafkatopics.kafka.strimzi.io
  kafkausers.kafka.strimzi.io
  kafkaconnects.kafka.strimzi.io
  kafkaconnectors.kafka.strimzi.io
  kafkamirrormaker2s.kafka.strimzi.io
  kafkanodepools.kafka.strimzi.io
  kafkabridges.kafka.strimzi.io
  kafkarebalances.kafka.strimzi.io
  strimzipodsets.core.strimzi.io
)

for crd in "${CRDS[@]}"; do
  kubectl delete crd "$crd" --ignore-not-found
done

echo "Deleting Strimzi deployments and other resources..."

# Delete Strimzi operator deployments (usually in default or strimzi namespace)
kubectl delete deployment strimzi-cluster-operator -n $NAMESPACE --ignore-not-found
kubectl delete serviceaccount strimzi-cluster-operator -n $NAMESPACE --ignore-not-found
kubectl delete configmap strimzi-cluster-operator -n $NAMESPACE --ignore-not-found
kubectl delete rolebinding --all -n $NAMESPACE --ignore-not-found
kubectl delete role --all -n $NAMESPACE --ignore-not-found

echo "All Strimzi resources deleted."
