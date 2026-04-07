# @healthcare/auth-client

Framework-agnostic authentication client using **React Context** for managing user sessions, sign-in/sign-out flows, and Entra ID OIDC integration across all micro frontends.

## Why React Context (Not NextAuth)

| Reason | Details |
|---|---|
| **Framework Independence** | Pure React Context works with any build tool (Vite, webpack, Parcel) — no Next.js dependency required |
| **Module Federation Compatibility** | Shared as a singleton across federated MFEs without framework-specific server-side session handling |
| **Lightweight** | Zero external dependencies beyond React — no added bundle size |
| **Configurable** | `AuthConfig` type allows runtime configuration of Entra ID endpoints per environment |

## Exports

```typescript
export { authConfig } from './auth-config';
export type { AuthConfig } from './auth-config';
export { useSession, useAuth, signIn, signOut, AuthContext } from './client';
export type { UserSession } from './types';
```

| Export | Type | Description |
|---|---|---|
| `AuthContext` | React Context | Provider wrapping the app root in Shell |
| `useSession()` | Hook | Returns current `UserSession` (user, roles, tokens) |
| `useAuth()` | Hook | Returns sign-in/sign-out functions and auth state |
| `signIn()` | Function | Initiates Entra ID OIDC login flow |
| `signOut()` | Function | Clears session and redirects to logout endpoint |
| `authConfig` | Object | Default auth configuration |
| `AuthConfig` | Type | Configuration shape for Entra ID endpoints |
| `UserSession` | Type | Session type with user profile, roles, and access token |

## Usage

```tsx
// In Shell app root
import { AuthContext } from '@healthcare/auth-client';

function App() {
  return (
    <AuthContext>
      <Router />
    </AuthContext>
  );
}

// In any MFE component
import { useSession, useAuth } from '@healthcare/auth-client';

function PatientView() {
  const { user, roles } = useSession();
  const { signOut } = useAuth();
  // ...
}
```

## Environment Configuration

| Setting | Local | Staging | Production |
|---|---|---|---|
| **Auth Provider** | Mock/dev tokens | Entra ID (test tenant) | Entra ID (prod tenant) |
| **Client ID** | Dev client ID | Staging app registration | Production app registration |
| **Redirect URI** | `http://localhost:3000/callback` | Staging SWA URL | Production SWA URL |

## Peer Dependencies

- `react` ^19.0.0
