## 1. Start the dashboard for the cluster by running the following command
```
source start-dashboard.sh
``` 

Make sure to copy the printed token in the console, you'll need it when login in the dashboard.

Be sure that metrics server is running, this way you can visualize more information in the dashboard.

Lastly, make sure to change the default namespace to "kafka", in the top left corner.

You can access the dashboard in the following link:
```
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/#/workloads?namespace=kafka
```