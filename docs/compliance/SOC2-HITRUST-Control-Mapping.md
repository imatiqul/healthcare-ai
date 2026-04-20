# HealthQ Copilot — SOC 2 Type II & HITRUST CSF Control Mapping

**Version**: 1.0  
**Scope**: HealthQ Copilot SaaS platform (`healthq-copilot-rg`, Azure East US 2)  
**Last Reviewed**: Phase 8 implementation  
**Certification Target**: SOC 2 Type II + HITRUST CSF v11.3

---

## 1. Trust Service Criteria (SOC 2) Mapping

### CC1 — Control Environment

| Control Ref | Requirement | Implementation | Evidence Location |
|---|---|---|---|
| CC1.1 | Management commitment to information security | Azure RBAC + Entra ID enforced; least-privilege roles | `infra/bicep/modules/managed-identities.bicep` |
| CC1.2 | Independence of oversight | Separate Platform Admin vs Tenant Admin roles; break-glass audit | `src/HealthQCopilot.Identity/Endpoints/BreakGlassEndpoints.cs` |
| CC1.3 | Accountability assignment | GitHub CODEOWNERS; PR approval gates (2 reviewers) | `.github/CODEOWNERS` |

### CC2 — Communication & Information

| Control Ref | Requirement | Implementation | Evidence Location |
|---|---|---|---|
| CC2.1 | Quality of information | Structured logging (Serilog + OTLP); correlation IDs | `src/HealthQCopilot.Infrastructure/Observability/` |
| CC2.2 | Internal communications | Dapr pub/sub with Azure Service Bus; dead-letter alerts | `infra/bicep/modules/monitor-alerts.bicep` — `dlqAlert` |
| CC2.3 | External communications | FHIR R4 API + APIM developer portal | `infra/bicep/modules/apim.bicep` |

### CC3 — Risk Assessment

| Control Ref | Requirement | Implementation | Evidence Location |
|---|---|---|---|
| CC3.1 | Risk identification | OWASP Top-10 controls: injection prevention, auth hardening | `src/HealthQCopilot.Infrastructure/Security/SecurityHeadersMiddleware.cs` |
| CC3.2 | Risk analysis | Azure Defender for Containers enabled (see Key Vault module) | `infra/bicep/modules/key-vault.bicep` |
| CC3.3 | Risk mitigation | Canary deployments limit blast radius | `infra/argocd/rollouts.yaml` |

### CC6 — Logical & Physical Access Controls

| Control Ref | Requirement | Implementation | Evidence Location |
|---|---|---|---|
| CC6.1 | Logical access controls | MSAL B2C + PKCE; MFA enforced via feature flag | `src/HealthQCopilot.Infrastructure/Auth/` |
| CC6.2 | New access provisioning | Tenant onboarding endpoint requires PlatformAdmin | `src/HealthQCopilot.Identity/Endpoints/TenantOnboardingEndpoints.cs` |
| CC6.3 | Remove access | GDPR offboarding `DELETE /api/v1/tenants/{id}` removes all user records | `src/HealthQCopilot.Identity/Endpoints/TenantOnboardingEndpoints.cs` |
| CC6.6 | Logical access restrictions | Feature flags gate all new capabilities; per-tenant App Config labels | `src/HealthQCopilot.ServiceDefaults/Features/HealthQFeatures.cs` |
| CC6.7 | Transmission encryption | TLS 1.2+ enforced at APIM + ACA; Dapr mTLS enabled | `infra/bicep/modules/apim.bicep` — `customProperties` |
| CC6.8 | Malicious software controls | Container image scanning in ACR; Defender for Containers | `infra/bicep/modules/acr.bicep` |

### CC7 — System Operations

| Control Ref | Requirement | Implementation | Evidence Location |
|---|---|---|---|
| CC7.1 | Vulnerability detection | GitHub Dependabot; CodeQL SAST in CI | `.github/workflows/pr-validation.yml` |
| CC7.2 | Monitoring anomalies | Azure Monitor alerts for error rate, latency, DLQ | `infra/bicep/modules/monitor-alerts.bicep` |
| CC7.3 | Evaluating alerts | PagerDuty routing; on-call runbook in `/docs/runbooks/` | `infra/bicep/modules/monitor-alerts.bicep` — `pagerDutyWebhookUrl` |
| CC7.4 | Response to incidents | Break-glass access audit trail; Sentinel SIEM | `infra/bicep/modules/sentinel.bicep` |
| CC7.5 | Recovery from incidents | Argo Rollouts automatic canary rollback | `infra/argocd/rollouts.yaml` |

### CC9 — Risk Mitigation

| Control Ref | Requirement | Implementation | Evidence Location |
|---|---|---|---|
| CC9.1 | Risk identification from vendors | Supply chain SBOMs generated in CI (CycloneDX) | `.github/workflows/microservice-deploy.yml` |
| CC9.2 | Business continuity | Azure geo-redundant postgres + Redis; AKS multi-zone | `infra/bicep/modules/postgres.bicep`, `aks.bicep` |

---

## 2. HITRUST CSF v11.3 Control Mapping

### 01 — Information Security Management Program

| HITRUST Control | Implementation |
|---|---|
| 01.a Information Security Policy | This document + `docs/HealthcareAI/` architecture docs |
| 01.b Review of the Information Security Policy | Quarterly review cycle; tracked via GitHub Issues |

### 06 — Compliance

| HITRUST Control | Implementation |
|---|---|
| 06.a Identification of Applicable Legislation | HIPAA BAA template; GDPR offboarding endpoint; NHS DSP mapping |
| 06.d Data Protection and Privacy | Consent management service; PHI audit middleware |
| 06.e Prevention of Misuse | Rate limiting at APIM + service level; anomaly detection alerts |

### 07 — Asset Management

| HITRUST Control | Implementation |
|---|---|
| 07.a Inventory of Assets | Bicep template as authoritative IaC; all resources tagged `env`, `service` |
| 07.b Ownership of Assets | Managed identities per service; RBAC role assignments in `managed-identities.bicep` |

### 09 — Access Control

| HITRUST Control | Implementation |
|---|---|
| 09.a Access Control Policy | MSAL B2C; role-based access (`UserRole` enum) |
| 09.ab Monitoring System Use | Azure Sentinel + Log Analytics workspace; PHI audit stream |
| 09.ac Password Management | B2C handles credential policy; TOTP OTP via ACS SMS |
| 09.j Equipment Identification | AKS node pool labels; SPIFFE/SPIRE via Dapr mTLS |

### 10 — Information Systems Acquisition, Development, Maintenance

| HITRUST Control | Implementation |
|---|---|
| 10.a Security Requirements Analysis | Architecture Decision Records in `docs/` |
| 10.b Correct Processing in Applications | FluentValidation at all API boundaries; xUnit tests 80%+ coverage |
| 10.k Change Control Procedures | GitHub PR + 2-reviewer approval; Argo CD GitOps; canary rollouts |

### 11 — Information Security Incident Management

| HITRUST Control | Implementation |
|---|---|
| 11.a Reporting Information Security Events | Sentinel alerts; PagerDuty routing |
| 11.b Reporting Security Weaknesses | GitHub Security Advisory; Dependabot alerts |
| 11.c Responsibilities and Procedures | Break-glass audit; auto-expiry of emergency access |

---

## 3. Evidence Collection Plan

For Type II audit (12-month observation period):

| Evidence | Collection Method | Frequency |
|---|---|---|
| Access logs | Log Analytics workspace → Sentinel | Continuous |
| Change management records | GitHub PR audit log export | Monthly |
| Vulnerability scan results | Dependabot + CodeQL reports | Per PR |
| Incident response records | PagerDuty timeline export | Per incident |
| Backup verification | Azure Backup job history | Weekly |
| Penetration test report | Annual third-party pentest | Annual |
| Employee security training | MS Learn compliance training completion | Annual |

---

## 4. Gaps & Remediation Backlog

| Gap | Risk | Remediation | Target |
|---|---|---|---|
| Penetration test not yet conducted | High | Commission third-party pentest | Q2 |
| Security training program not formalised | Medium | MS Learn compliance track + tracking | Q1 |
| Backup recovery testing not automated | Medium | Add `backup-verify` GitHub Action | Q2 |
| Vendor risk assessments for Qdrant/OpenAI | Medium | Complete vendor questionnaires | Q2 |
