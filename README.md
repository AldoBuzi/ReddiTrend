# 📈 ReddiTrend

A distributed application for real-time visualization, in the form of a graph, of the most influential current topics along with their associated sentiment based on posts from the Reddit platform.

## 📚 Description

The complete pipeline is as follows:
1. Collection of information from the top 1,000 hot Reddit posts from the last 24 hours
2. Analysis of the posts to extract the main keywords and their associated sentiment
3. Creation of correlations between keywords based on their co-occurrence within the same post
4. Graph-based visualization of the most important keywords and their related sentiments

## 🚀 Tech Stack

### 🔧 Control Plane

- **Kubernetes**: Container orchestration for deploying and managing services.
- **Strimzi**: Kafka operator for running Apache Kafka on Kubernetes.
- **Calico**: Kubernetes networking and network policy enforcement.
- **Traefik**: Ingress controller for routing external traffic into the cluster.
- **Grafana**: Monitoring dashboard for system metrics (CPU, RAM, etc.).

### 📡 Data Plane
- **Kafka**: Real-time streaming of Reddit post data.
- **Spark**: Processing pipeline for keyword extraction, sentiment analysis, and correlation computation.
- **Cassandra**: Scalable distributed database for storing graph-related data.
- **FastAPI**: Lightweight Python web framework for exposing data to the frontend.
- **Graphology & Sigma.js**: Visualization stack for rendering interactive keyword graphs in the browser.

## ⚙️ Architecture

![architecture](assets/architecture.png)