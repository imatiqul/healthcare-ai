# HealthQ Copilot — FedRAMP Authorization Boundary

**Version**: 1.0  
**Date**: Phase 8 implementation  
**Authorization Type**: FedRAMP Moderate (target)  
**Cloud Provider**: Microsoft Azure (FedRAMP High authorized)  
**System Owner**: HealthQ Health Systems Inc.  
**ISSO**: Information System Security Officer (to be designated)

---

## 1. System Description

HealthQ Copilot is a multi-tenant, cloud-native healthcare AI platform providing:
- AI-assisted clinical documentation and coding
- FHIR R4 health data exchange
- Real-time patient triage and escalation
- Population health management
- Revenue cycle automation with prior authorization

**Federal Use Case**: VA Medical Centers, DoD Military Health System, Indian Health Service integration with FHIR-based health data exchange.

---

## 2. Authorization Boundary

### 2.1 In-Scope Components (FedRAMP Boundary)

| Component | Type | Cloud Service | FedRAMP Impact |
|---|---|---|---|
| APIM Gateway | PaaS | Azure API Management (East US 2) | Moderate |
| AKS Cluster | PaaS | Azure Kubernetes Service (private) | Moderate |
| PostgreSQL | PaaS | Azure Database for PostgreSQL Flexible Server | Moderate |
| Redis Cache | PaaS | Azure Cache for Redis | Low |
| Azure Service Bus | PaaS | Azure Service Bus Premium | Moderate |
| Azure Event Hubs | PaaS | Azure Event Hubs (PHI audit stream) | High |
| Azure Key Vault | PaaS | Azure Key Vault (FIPS 140-2 HSM) | High |
| Azure Container Registry | PaaS | ACR Premium | Moderate |
| Log Analytics / Sentinel | PaaS | Azure Monitor / Sentinel | Moderate |
| Azure AD B2C | PaaS | Microsoft Entra External ID | Moderate |

### 2.2 Out-of-Scope / Interconnected Systems

| Component | Reason Out-of-Scope | POC/Owner |
|---|---|---|
| Azure OpenAI | Separate FedRAMP authorization; data processing agreement required | Microsoft |
| Qdrant Vector DB | In-cluster, no PHI stored; embeddings only | HealthQ DevOps |
| Dapr Sidecar | Kubernetes-native; inherits AKS boundary | HealthQ DevOps |
| NHS FHIR Endpoints | External system; NHS England authorization | NHS Digital |
| EHR Systems (Epic/Cerner) | External; governed by trust data-sharing agreements | NHS/IHS |

---

## 3. Data Categorization (FIPS 199)

| Data Type | Confidentiality | Integrity | Availability | Overall Impact |
|---|---|---|---|---|
| Protected Health Information (PHI) | High | High | Moderate | **High** |
| De-identified clinical data | Moderate | Moderate | Low | **Moderate** |
| Administrative / billing data | Moderate | High | Moderate | **Moderate** |
| System configuration / logs | Low | Moderate | Low | **Low** |

**System Impact Level**: Moderate (targeting FedRAMP Moderate ATO)  
**Note**: PHI data categorized at High confidentiality; system pursues Moderate ATO with compensating controls for PHI components.

---

## 4. Security Controls Summary (NIST SP 800-53 Rev 5)

### AC — Access Control

| Control | Implementation | Status |
|---|---|---|
| AC-2 Account Management | MSAL B2C + tenant onboarding API; automated deprovisioning | Implemented |
| AC-3 Access Enforcement | RBAC at API and service level; feature flags for capability isolation | Implemented |
| AC-6 Least Privilege | Managed identities; scoped API permissions | Implemented |
| AC-12 Session Termination | B2C token expiry (1 hour); refresh token rotation | Implemented |
| AC-17 Remote Access | VPN not required; zero-trust via B2C + mTLS | Implemented |

### AU — Audit and Accountability

| Control | Implementation | Status |
|---|---|---|
| AU-2 Event Logging | PHI audit middleware; all HTTP requests logged | Implemented |
| AU-3 Content of Audit Records | UserId, resource, method, status, timestamp, correlation ID | Implemented |
| AU-9 Protection of Audit Information | Append-only PostgreSQL RLS; Event Hubs immutable stream | Implemented |
| AU-11 Audit Record Retention | 7-year retention (2557 days) in Log Analytics + Sentinel | Implemented |
| AU-12 Audit Generation | OpenTelemetry OTLP; structured logs | Implemented |

### CA — Assessment, Authorization, Maintenance

| Control | Implementation | Status |
|---|---|---|
| CA-7 Continuous Monitoring | Azure Monitor + Sentinel + Defender for Containers | Implemented |
| CA-8 Penetration Testing | Annual pentest scheduled | Planned Q2 |

### CM — Configuration Management

| Control | Implementation | Status |
|---|---|---|
| CM-2 Baseline Configuration | Bicep IaC as authoritative baseline | Implemented |
| CM-3 Configuration Change Control | GitHub PR + Argo CD GitOps | Implemented |
| CM-7 Least Functionality | AKS nodes hardened; no debug ports exposed | Implemented |

### IA — Identification & Authentication

| Control | Implementation | Status |
|---|---|---|
| IA-2 User Identification | Unique userId per account; B2C external ID | Implemented |
| IA-2(1) MFA for Privileged Accounts | MFA enforced via `HealthQ:MfaEnforced` feature flag | Implemented |
| IA-5 Authenticator Management | B2C handles passwords; TOTP OTP via ACS | Implemented |
| IA-8 Non-Org User Identification | B2C custom policies for patient-facing flows | Implemented |

### IR — Incident Response

| Control | Implementation | Status |
|---|---|---|
| IR-4 Incident Handling | Sentinel + PagerDuty; runbook at `/docs/runbooks/incident-response.md` | Implemented |
| IR-5 Incident Monitoring | Azure Sentinel alert rules | Implemented |
| IR-6 Incident Reporting | 72-hour HIPAA breach notification; PagerDuty escalation | Implemented |

### SC — System & Communications Protection

| Control | Implementation | Status |
|---|---|---|
| SC-8 Transmission Confidentiality | TLS 1.2+ enforced; Dapr mTLS between services | Implemented |
| SC-12 Cryptographic Key Management | Azure Key Vault FIPS 140-2 HSM; CMK for storage | Implemented |
| SC-28 Protection at Rest | PostgreSQL TDE; Azure Storage CMK | Implemented |

### SI — System & Information Integrity

| Control | Implementation | Status |
|---|---|---|
| SI-2 Flaw Remediation | Dependabot PRs; critical patches within 24 hours | Implemented |
| SI-3 Malicious Code Protection | Defender for Containers; ACR image scanning | Implemented |
| SI-10 Information Input Validation | FluentValidation at all boundaries | Implemented |

---

## 5. FedRAMP ATO Roadmap

| Milestone | Target | Status |
|---|---|---|
| System Security Plan (SSP) draft | Q2 | Not started |
| 3PAO engagement | Q2 | Not started |
| Penetration test | Q2 | Not started |
| SAR (Security Assessment Report) | Q3 | Not started |
| POA&M creation | Q3 | Not started |
| ATO submission to FedRAMP PMO | Q4 | Not started |

---

## 6. Interconnection Security Agreements (ISA)

| External System | Data Exchanged | Agreement Type | Status |
|---|---|---|---|
| VA FHIR Server | Patient demographics, clinical data | ISA + MOU required | To negotiate |
| DoD MHS GENESIS | FHIR R4 health records | ISA required | To negotiate |
| NHS England FHIR API | UK patient data | DPIA + DSA | In progress |
