#!/bin/bash

#Make sure you start the driver first

NAMESPACE=redditrend
LABEL_SELECTOR="spark-role=driver"  # or any label that identifies your driver pod
LOCAL_PORT=4040
REMOTE_PORT=4040

# Get the pod name dynamically
POD_NAME=$(kubectl get pods -n $NAMESPACE -l $LABEL_SELECTOR -o jsonpath="{.items[0].metadata.name}")

if [ -z "$POD_NAME" ]; then
  echo "No pod found with label $LABEL_SELECTOR in namespace $NAMESPACE"
  exit 1
fi

echo "Port-forwarding $POD_NAME from local port $LOCAL_PORT to remote port $REMOTE_PORT..."

kubectl port-forward -n $NAMESPACE $POD_NAME $LOCAL_PORT:$REMOTE_PORT
