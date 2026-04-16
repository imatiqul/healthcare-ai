# HealthcareAI Platform: Observability and Mesh Integration

## Summary of Recent Enhancements

- **Istio Service Mesh**: All microservices are now mesh-enabled via Helm, with sidecar injection and mTLS support.
- **OpenTelemetry Tracing**: Distributed tracing is enabled for all services, with an in-cluster OpenTelemetry Collector and configurable exporters.
- **Documentation**: Guides for Istio mesh and OpenTelemetry tracing are now available in `infra/helm/`.

## Next Steps
- Add Istio VirtualService and DestinationRule manifests for advanced traffic management.
- Integrate Jaeger, Zipkin, or Azure Monitor exporters in the OpenTelemetry Collector config as needed.
- Use Kiali, Jaeger, or Grafana for mesh observability.
- Expand automated testing for mesh and tracing features.

---

For details, see:
- `infra/helm/istio-mesh.md`
- `infra/helm/otel-tracing.md`
