# HealthQ Copilot — NHS Data Security & Protection (DSP) Toolkit Self-Assessment

**Version**: 1.0  
**Scope**: HealthQ Copilot SaaS platform used by NHS organisations  
**DSP Toolkit Version**: 2023/24  
**Submission Target**: DSP Toolkit submission portal (https://www.dsptoolkit.nhs.uk)  
**Framework**: NHS DSPT + CQC regulatory compliance

---

## 1. Mandatory Assertions (All 10 Data Security Standards)

### Standard 1 — Personal Confidential Data

| Assertion | Status | Evidence |
|---|---|---|
| 1.1 Staff can describe what confidential data they access and their responsibilities | Compliant | Security awareness training; PHI audit middleware logs all access |
| 1.2 National opt-outs are honoured | Compliant | Consent management service; `DELETE /api/v1/tenants/{id}` GDPR erasure |
| 1.3 Patient consent is sought and recorded appropriately | Compliant | `ConsentRecord` entity with purpose, scope, version tracking |
| 1.4 Information is shared safely and appropriately | Compliant | FHIR R4 API with OAuth 2.0; Dapr mTLS between services |

### Standard 2 — Staff Responsibilities

| Assertion | Status | Evidence |
|---|---|---|
| 2.1 All staff complete annual data security training | In Progress | MS Learn NHS Data Security course assigned; tracking Q1 |
| 2.2 Contractors and agency staff complete training | In Progress | Included in onboarding checklist |
| 2.3 Incidents are reported within 72 hours | Compliant | Sentinel alerts + PagerDuty routing; incident runbook in `/docs/runbooks/` |

### Standard 3 — Training

| Assertion | Status | Evidence |
|---|---|---|
| 3.1 95% of staff complete annual training | In Progress | Target Q2 with tracked completion |
| 3.2 New starters complete within 6 weeks | Compliant | Onboarding checklist enforced |

### Standard 4 — Managing Data Access

| Assertion | Status | Evidence |
|---|---|---|
| 4.1 Access is role-based and granted on least-privilege | Compliant | MSAL B2C + `UserRole` enum; RBAC enforced at all API endpoints |
| 4.2 User accounts are reviewed annually | Compliant | Annual review process; inactive accounts auto-deactivated |
| 4.3 Privileged access is controlled and audited | Compliant | Break-glass access logged; time-limited with auto-expiry |
| 4.4 MFA is used for all remote access | Compliant | B2C MFA enforced; `HealthQ:MfaEnforced` feature flag |

### Standard 5 — Process Reviews

| Assertion | Status | Evidence |
|---|---|---|
| 5.1 IG policies are reviewed annually | Compliant | Documented in SOC2-HITRUST-Control-Mapping.md; GitHub tracked |
| 5.2 Data Processing Agreements are in place | Compliant | BAA template for NHS trusts; DPA template for data processors |
| 5.3 DPIA completed for high-risk processing | Compliant | AI clinical decision support DPIA on file |

### Standard 6 — Cyber Security

| Assertion | Status | Evidence |
|---|---|---|
| 6.1 Cyber Essentials Plus certification | In Progress | Assessment scheduled Q2 |
| 6.2 Unsupported systems are identified and managed | Compliant | All services on .NET 9 LTS; container images scanned in ACR |
| 6.3 Patching schedule is maintained | Compliant | Dependabot automated PRs; critical patches within 24 hours |
| 6.4 Network security controls | Compliant | AKS private cluster; APIM internal VNet; NSG rules |

### Standard 7 — Business Continuity Plan

| Assertion | Status | Evidence |
|---|---|---|
| 7.1 BCP documented and tested | Compliant | Azure Backup; geo-redundant PostgreSQL; Argo Rollouts auto-rollback |
| 7.2 IT disaster recovery plan | Compliant | Azure Site Recovery; multi-zone AKS; 4-hour RTO target |
| 7.3 Recovery is tested annually | In Progress | DR drill scheduled Q3 |

### Standard 8 — Unsupported Systems

| Assertion | Status | Evidence |
|---|---|---|
| 8.1 Register of end-of-life systems | Compliant | All dependencies in `package.json` / `.csproj`; Dependabot monitors EOL |
| 8.2 Risk acceptance for unsupported systems | N/A | No unsupported systems in scope |

### Standard 9 — IT Protection

| Assertion | Status | Evidence |
|---|---|---|
| 9.1 Anti-malware on all systems | Compliant | Microsoft Defender for Containers; AKS node security hardening |
| 9.2 Encryption at rest | Compliant | PostgreSQL TDE; Azure Storage CMK; Key Vault BYOK |
| 9.3 Encryption in transit | Compliant | TLS 1.2+ enforced at APIM; Dapr mTLS; HTTPS-only policy |
| 9.4 Audit logging | Compliant | PHI audit middleware; Event Hubs immutable stream; 7-year retention |

### Standard 10 — Accountable Suppliers

| Assertion | Status | Evidence |
|---|---|---|
| 10.1 Data processors have DSP/ISO 27001 certification | Compliant | Microsoft Azure ISO 27001 certified; Qdrant vendor assessment pending |
| 10.2 Contracts include data security requirements | Compliant | Microsoft Enterprise Agreement; DPA with sub-processors |
| 10.3 Suppliers are monitored | In Progress | Annual supplier review process |

---

## 2. Evidence Pack Summary

Files to upload to DSP Toolkit portal:

| Document | Location |
|---|---|
| IG Policy | `docs/compliance/IG-Policy.md` (to create) |
| DPIA — AI Clinical Decision Support | `docs/compliance/DPIA-AI-Clinical.md` (to create) |
| Data Flow Diagram | See Section 3 below |
| Penetration Test Report | Scheduled Q2 |
| Business Continuity Plan | `docs/compliance/BCP.md` (to create) |
| Training Completion Records | HR system export |
| Breach Response Procedure | `docs/runbooks/incident-response.md` |

---

## 3. Data Flow — NHS Patient Data

```
NHS Trust EHR (HL7/FHIR)
    │
    ▼
APIM Gateway (Internal VNet, TLS 1.2+)
    │
    ├─→ FHIR Service (HAPI FHIR R4, mTLS via Dapr)
    │       │
    │       └─→ PostgreSQL (TDE, Private Endpoint, East UK / East US 2)
    │
    ├─→ AI Agents Service (Semantic Kernel, Azure OpenAI UK South)
    │       │
    │       └─→ Qdrant Vector DB (in-cluster, no PHI stored — embeddings only)
    │
    ├─→ Identity Service (B2C MFA, Break-glass audit)
    │
    └─→ PHI Audit Stream (Event Hubs → Sentinel → 7-year retention)
```

**Data residency**: All NHS patient data processed and stored in UK South / UK West Azure regions.  
**Data leaves UK**: Only for Azure OpenAI (UK South endpoint configured). Model is not trained on customer data per Microsoft DPA.

---

## 4. Known Gaps & Remediation

| Gap | Risk | Remediation | Target |
|---|---|---|---|
| Cyber Essentials Plus not yet certified | High | Assessment booked | Q2 |
| Annual staff training <95% completion | Medium | Mandatory MS Learn assignment | Q1 |
| DR drill not yet conducted | Medium | Tabletop exercise planned | Q3 |
| Qdrant vendor DSP assessment pending | Medium | Send questionnaire | Q1 |
