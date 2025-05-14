# Set Up Spark (Kafka) consumer

This folder contains all the required files to run our spark consumer.

## 1: Build the Docker Image
```
docker build -t reddit-spark-consumer:latest .
```
If you want to change the image name, make sure to update the reference in the yaml file.

## 2: Apply the image to our pod 
```
kubectl apply -f spark-consumer.yaml
```
## 3. Stop your job 
```
kubectl delete job spark-kafka-consumer -n kafka
```
## 4. You can also attach to the consumer to check its logs
```
kubectl logs -f job/spark-kafka-consumer -n kafka
```