kubectl create namespace my-grafana


kubectl apply -f grafana.yaml --namespace=my-grafana

# For Deployment
kubectl get deployments --namespace=my-grafana -o wide

# For service
kubectl get svc --namespace=my-grafana -o wide
