If you want to try the server in your local browser (thus outside the cluster), use:
```kubectl port-forward svc/fastapi-service 8080:80 -n kafka```

To get a mock graph, please change the parameter ```USE_MOCK``` within the yaml to ```true```