# Istio Service Mesh Integration Guide

This document describes how Istio service mesh is integrated into the HealthcareAI platform using Helm.

## 1. Overview
- All microservices are deployed with Istio sidecar injection enabled via Helm.
- Istio enables mTLS, traffic management, and observability for all services.

## 2. Enabling Istio Sidecar Injection
- The Helm deployment template adds the annotation:
  ```yaml
  sidecar.istio.io/inject: "true"
  ```
  to all service pods.
- Ensure the namespace is labeled for Istio injection:
  ```sh
  kubectl label namespace healthcare istio-injection=enabled
  ```

## 3. Traffic Management
- Use Istio VirtualService and DestinationRule manifests to control routing, canary, and failover.
- Add these manifests as needed in `infra/helm/templates`.

## 4. mTLS and Security
- Istio enables mutual TLS (mTLS) by default for all services in the mesh.
- You can enforce strict mTLS with a PeerAuthentication manifest:
  ```yaml
  apiVersion: security.istio.io/v1beta1
  kind: PeerAuthentication
  metadata:
    name: default
    namespace: healthcare
  spec:
    mtls:
      mode: STRICT
  ```

## 5. Observability
- Istio automatically collects metrics, logs, and traces for all traffic in the mesh.
- Use Kiali, Jaeger, or Grafana for mesh observability.

## 6. References
- [Istio Docs](https://istio.io/latest/docs/)
- [Istio Traffic Management](https://istio.io/latest/docs/tasks/traffic-management/)
- [Istio Security](https://istio.io/latest/docs/tasks/security/)

---

For further customization, see the Helm templates and Istio documentation.
