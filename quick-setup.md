# Setting Up Kafka with Minikube and Strimzi

Note that this initial configuration runs everyting in the same cluster but on different nodes.

## 1. (Only if required) Set your shell environment to use the Docker daemon inside the specified Minikube cluster
```
eval $(minikube -p ReddiTrend-Cluster docker-env)
```
You can check your default docker env with:
```
docker info | grep "Name"
```
It should return something like: ```Name: ReddiTrend-Cluster```
## 2. Start Minikube

```
minikube start -p ReddiTrend-Cluster
```
## 3. Create the Kafka Namespace
```
kubectl create namespace kafka
```
Note that almost every command will require to specify the namespace by adding ``` -n kafka ``` at the end of each command.
## 4. Install Strimzi Operator
Download and install the Strimzi Operator from the official quickstart:
Check the official guide for any doubt:
https://strimzi.io/quickstarts/
```
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
```
## 5. Deploy Kafka Cluster
Apply the single-node Kafka cluster configuration.
Run the following command if you want to test or gain confidence with the tools:
```
kubectl apply -f https://strimzi.io/examples/latest/kafka/kafka-single-node.yaml -n kafka
```
If you changed the ```kraft-kafka.yaml``` or for any other reason, you can use:
```
kubectl apply -f kraft-kafka.yaml -n kafka
```
Create the default topic by applying this yaml:
```
kubectl apply -f kafka-topic.yaml -n kafka
```
Now strimzi will have created all the necessary pods to run the broker. Your broker is correctly running. Check the pods by using:
```
 kubectl get pods -n kafka  
```
Note(TODO): This must be changed to allow replicas, we must study strimzi deeper to understand how we can configure it.
## 6. (Optional) Wait for Kafka to Be Ready
You can wait until the Kafka cluster is ready before proceeding:

```
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n kafka
```

## 7.(Optional) Test with dummy producer, broker and consumer
### Producer
```
kubectl -n kafka run kafka-producer -ti --image=quay.io/strimzi/kafka:0.46.0-kafka-4.0.0 --rm=true --restart=Never -- bin/kafka-console-producer.sh --bootstrap-server my-cluster-kafka-bootstrap:9092 --topic reddit-posts
```
This creates a simple producer where you can write messages that will be send to the broker. 
The default topic is ``` reddit-posts ``` and the default name for the bootstrap server is ``` my-cluster-kafka-bootstrap``` as you can see from the above command. If you want to change the name of the bootstrap server, please read point 8.

The broker, if you followed the previous instructions, is already running, therefore you can already send messages to it.
Check spark-consumer folder if you want to run the consumer as well.

## 8. (Optional) Change bootstrap server name:
To change its name, you must edit the ```kraft-kafka.yaml``` file used by the broker, under the folder ```kafka```. The field you must change are:
1. strimzi.io/cluster
2. metadata/name
3. (Optional) Change the namespace and all its references

Lastly, make sure to update producer and consumer references.


## 9. Run spark-rbac.yaml
This file create a service account and a role binding, apply it with:
```
kubectl apply -f spark-rbac.yaml
```
To check if the account has been correctly created use:
```
kubectl get serviceaccounts -n kafka
```
and 
```
kubectl get clusterrolebindings -n kafka | grep spark
```
And check with this command that the answer is yes:
```
kubectl auth can-i create pod --as=system:serviceaccount:kafka:spark
```

## Download storage class:
```
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
```