#!/bin/bash


kubectl apply -f dashboard-admin.yaml


kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
echo "\n"
echo "\n"
echo "####################  YOUR TOKEN  ####################"
kubectl -n kubernetes-dashboard create token admin-user
echo "#####################################################"
echo "\n"
echo "\n"
kubectl proxy
