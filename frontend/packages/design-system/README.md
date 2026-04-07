# @healthcare/design-system

Shared UI component library built on **MUI 6.4 + Emotion** that provides themed, accessible components used by all micro frontends in the Healthcare AI platform.

## Why MUI 6.4

| Reason | Details |
|---|---|
| **Accessibility** | WCAG 2.1 AA compliant out of the box — critical for healthcare applications that must meet Section 508 requirements |
| **Enterprise Theming** | Theme provider with design tokens for consistent branding across 6 independently deployed MFEs |
| **Component Richness** | 50+ production-ready components (DataGrid, DatePicker, Autocomplete) that cover healthcare UI patterns without custom development |
| **Emotion CSS-in-JS** | Dynamic styling based on theme tokens; tree-shakeable for optimized bundle sizes per MFE |

## Exported Components

Defined in `src/index.ts` — re-exports themed MUI components with healthcare-specific defaults:

- **Button** — primary, secondary, and danger variants with loading states
- **Card** — content container with header, body, and action areas
- **Badge** — status indicators for priority levels, risk scores, and workflow states
- **Input** — form input with validation states and helper text

## Installation

This is an internal workspace package — automatically available to all `frontend/apps/*` via pnpm workspaces:

```json
// In any MFE's package.json
{
  "dependencies": {
    "@healthcare/design-system": "workspace:*"
  }
}
```

## Usage

```tsx
import { Button, Card, Badge, Input } from '@healthcare/design-system';

function MyComponent() {
  return (
    <Card>
      <Badge color="error" label="P1" />
      <Input label="Patient ID" required />
      <Button variant="contained">Submit</Button>
    </Card>
  );
}
```

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mui/material` | ^6.4.0 | Core component library |
| `@mui/icons-material` | ^6.4.0 | Material icons set |
| `@emotion/react` | ^11.14.0 | CSS-in-JS runtime for MUI |
| `@emotion/styled` | ^11.14.0 | Styled component API for custom extensions |

## Peer Dependencies

- `react` ^19.0.0
- `react-dom` ^19.0.0

## Development

```bash
cd frontend/packages/design-system
pnpm lint          # ESLint
pnpm type-check    # TypeScript validation
```
