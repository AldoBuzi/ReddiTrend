#!/bin/bash


if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "⚠️ Please source this script: 'source $0'"
  exit 1
fi

git clone https://github.com/prometheus-operator/kube-prometheus.git

cp ./grafana-config.yaml ./kube-prometheus/manifests/grafana-config.yaml

cd kube-prometheus


# Create the namespace and CRDs, and then wait for them to be available before creating the remaining resources
# Note that due to some CRD size we are using kubectl server-side apply feature which is generally available since kubernetes 1.22.
# If you are using previous kubernetes versions this feature may not be available and you would need to use kubectl create instead.
kubectl apply --server-side -f manifests/setup
kubectl wait \
    --for condition=Established \
    --all CustomResourceDefinition \
    --namespace=monitoring
kubectl apply -f manifests/


kubectl label namespace redditrend name=redditrend

kubectl apply -f grafana-network-policy.yaml


# To remove all stuff
# kubectl delete --ignore-not-found=true -f manifests/ -f manifests/setup