#!/bin/bash
# setup-dapr.sh — Provisions Dapr pub/sub for HealthQ Copilot ACA environment
#
# Prerequisites:
#   - Azure CLI logged in with Owner/Contributor on healthq-copilot-rg
#   - Service Bus namespace 'healthq-copilot-bus' already created (Standard SKU)
#
# Usage:
#   chmod +x infra/scripts/setup-dapr.sh
#   ./infra/scripts/setup-dapr.sh
#
# This script is IDEMPOTENT — safe to re-run.

set -euo pipefail

RG="healthq-copilot-rg"
ENV="healthq-copilot-env"
SB_NAMESPACE="healthq-copilot-bus"

echo "==> Retrieving Service Bus connection string..."
SB_CONN=$(az servicebus namespace authorization-rule keys list \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv)

echo "==> Writing Dapr pubsub component YAML..."
TMPFILE=$(mktemp /tmp/dapr-pubsub-XXXXXX.yaml)
cat > "$TMPFILE" <<EOF
name: pubsub
properties:
  componentType: pubsub.azure.servicebus.topics
  version: v1
  secrets:
    - name: sb-connection-string
      value: "${SB_CONN}"
  metadata:
    - name: connectionString
      secretRef: sb-connection-string
    - name: deadLetterTopic
      value: healthq-dlq
    - name: maxDeliveryCount
      value: "5"
  scopes:
    - voice
    - ai-agent
    - fhir
    - ocr
    - scheduling
    - notification
    - pop-health
    - revenue
    - identity
EOF

echo "==> Registering Dapr pubsub component in ACA environment..."
az containerapp env dapr-component set \
  --name "$ENV" \
  --resource-group "$RG" \
  --dapr-component-name pubsub \
  --yaml "$TMPFILE"
rm -f "$TMPFILE"

echo "==> Enabling Dapr on all backend services..."
SERVICES=(voice ai-agent fhir ocr scheduling notification pop-health revenue identity)
for SVC in "${SERVICES[@]}"; do
  echo "  Enabling Dapr on $SVC (app-id: $SVC)..."
  az containerapp dapr enable \
    --name "$SVC" \
    --resource-group "$RG" \
    --dapr-app-id "$SVC" \
    --dapr-app-port 8080 \
    --dapr-app-protocol http \
    --output none
done

echo "==> Setting Service Bus connection string on all services (for OutboxRelayService)..."
for SVC in "${SERVICES[@]}"; do
  echo "  Setting ConnectionStrings__ServiceBus on $SVC..."
  az containerapp update \
    --name "$SVC" \
    --resource-group "$RG" \
    --set-env-vars "ConnectionStrings__ServiceBus=${SB_CONN}" \
    --output none
done

echo ""
echo "==> Dapr setup complete!"
echo ""
echo "    Service Bus namespace : $SB_NAMESPACE"
echo "    Dapr component        : pubsub (pubsub.azure.servicebus.topics)"
echo "    Services with Dapr    : ${SERVICES[*]}"
echo ""
echo "    Next steps:"
echo "    - Verify services restart successfully in ACA portal"
echo "    - Optional: provision Azure Key Vault and register secretstore component"
echo "    - Optional: provision Azure Cache for Redis and register statestore component"
