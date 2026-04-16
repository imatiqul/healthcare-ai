# OpenTelemetry Tracing Setup for HealthcareAI Platform

This document describes how to enable and use distributed tracing with OpenTelemetry and Istio in the HealthcareAI platform.

## 1. Overview
- All microservices are deployed with Istio sidecar injection enabled.
- OpenTelemetry Collector is deployed as a cluster service.
- Services export traces to the collector using the OTLP protocol.
- The collector can be configured to export traces to logging, Jaeger, Zipkin, or Azure Monitor.

## 2. Enabling Tracing
- Istio sidecar injection is enabled via the `sidecar.istio.io/inject: "true"` annotation in Helm templates.
- OpenTelemetry environment variables are injected into all service pods for automatic trace export.
- The collector is deployed using the Helm templates: `otel-collector.yaml` and `otel-collector-configmap.yaml`.

## 3. Customizing Exporters
- By default, the collector exports traces to logging.
- To export to Jaeger, Zipkin, or Azure Monitor, edit `otel-collector-configmap.yaml` and add the desired exporter configuration.
- Example for Jaeger:
  ```yaml
  exporters:
    jaeger:
      endpoint: jaeger-collector.istio-system.svc.cluster.local:14250
      tls:
        insecure: true
  service:
    pipelines:
      traces:
        receivers: [otlp]
        exporters: [jaeger]
  ```

## 4. Deploying
- Deploy or upgrade the Helm chart:
  ```sh
  helm upgrade --install healthcareai ./infra/helm -n healthcare --values ./infra/helm/values.yaml --values ./infra/helm/values-otel.yaml
  ```

## 5. Verifying Traces
- Check the OpenTelemetry Collector logs:
  ```sh
  kubectl logs deployment/otel-collector -n healthcare
  ```
- If using Jaeger or Zipkin, access their UIs to view traces.

## 6. References
- [OpenTelemetry Collector Docs](https://opentelemetry.io/docs/collector/)
- [Istio Distributed Tracing](https://istio.io/latest/docs/tasks/observability/distributed-tracing/)

---

For further customization, see the Helm templates and values files in `infra/helm`.
