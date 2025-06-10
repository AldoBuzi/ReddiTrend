kubectl create -f manifests/setup 
until kubectl get servicemonitors --all-namespaces ; do echo "Waiting for CRDs..."; sleep 2; done
kubectl create -f manifests
kubectl get pods -n monitoring
kubectl port-forward svc/grafana -n monitoring 3000:3000



kubectl port-forward svc/prometheus-k8s -n monitoring 9090:9090



minikube ssh
sudo mkdir -p /data/grafana-dashboards
minikube cp ./my-dashboard.json /data/grafana-dashboards/my-dashboard.json

kubectl apply -f persistent-volume.yaml

kubectl apply -f grafana-dashboard-provisioning.yaml


kubectl edit deployment grafana -n monitoring


Add these under the container spec:
        volumeMounts:
        - name: dashboards-pvc
          mountPath: /var/lib/grafana/dashboards/custom
        - name: dashboard-provisioning
          mountPath: /etc/grafana/provisioning/dashboards


Then add this under spec.template.spec.volumes:
      volumes:
      - name: dashboards-pvc
        persistentVolumeClaim:
          claimName: grafana-dashboards-pvc
      - name: dashboard-provisioning
        configMap:
          name: grafana-dashboard-provisioning


kubectl rollout restart deployment grafana -n monitoring


