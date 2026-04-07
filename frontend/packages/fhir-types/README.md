# @healthcare/fhir-types

TypeScript type definitions for **FHIR R4** resources used across the Healthcare AI micro frontends.

## Why Dedicated FHIR Types

| Reason | Details |
|---|---|
| **Type Safety** | Compile-time validation of FHIR resource shapes — prevents runtime errors from mistyped clinical data fields |
| **Shared Contract** | Single source of truth for FHIR types across all 6 MFEs — changes propagate automatically via workspace dependency |
| **Lightweight** | Types-only package — zero runtime overhead, all definitions erased at build time |
| **FHIR R4 Aligned** | Types match the HL7 FHIR R4 specification that the HAPI FHIR server enforces |

## Exported Types

Key FHIR R4 resource types used by the platform:

- `Patient` — demographics, identifiers, contact info
- `Encounter` — clinical encounter records
- `Appointment` — scheduling appointments with status
- `Slot` — provider availability slots
- `Practitioner` — healthcare provider profiles
- `Observation` — clinical observations and measurements
- `Condition` — patient conditions and diagnoses

## Usage

```tsx
import type { Patient, Encounter, Appointment, Slot } from '@healthcare/fhir-types';

function PatientCard({ patient }: { patient: Patient }) {
  return <div>{patient.name?.[0]?.text}</div>;
}
```

## Installation

Automatically available via pnpm workspaces:

```json
{
  "dependencies": {
    "@healthcare/fhir-types": "workspace:*"
  }
}
```
