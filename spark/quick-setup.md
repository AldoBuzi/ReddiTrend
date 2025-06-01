Check cronjobs with:
 kubectl get cronjobs -n kafka   

Delete completed drviers with:
kubectl get pods -n kafka --no-headers | grep '^spark-top-nodes' | awk '{print $1}' | xargs kubectl delete pod -n kafka