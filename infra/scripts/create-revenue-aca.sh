#!/bin/bash
# Create the Revenue Cycle ACA container app
# Run this once to create the container app before CI/CD can deploy to it

RESOURCE_GROUP="healthq-copilot-rg"
ACA_ENV="healthq-copilot-env"
SERVICE_NAME="revenue"
IMAGE="ghcr.io/imatiqul/azure-ai-cloud-healthcare/healthq-copilot/revenue:latest"

echo "Creating ACA container app: $SERVICE_NAME"

az containerapp create \
  --name "$SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ACA_ENV" \
  --image "mcr.microsoft.com/dotnet/aspnet:9.0" \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars "ASPNETCORE_ENVIRONMENT=Production"

echo "Revenue ACA container app created. CI/CD will update the image on next push."
