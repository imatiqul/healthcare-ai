# @healthcare/tsconfig

Shared TypeScript configurations for the Healthcare AI frontend monorepo. Provides base and Vite-specific configurations used by all apps and packages.

## Why Shared Configs

| Reason | Details |
|---|---|
| **Consistency** | All 6 MFE apps and 4 packages use identical TypeScript strictness, module resolution, and target settings |
| **Single Point of Change** | Upgrading TypeScript settings (e.g., stricter checks) applies across the entire monorepo from one place |
| **Vite-Optimized** | Configurations are tuned for Vite's ESM-first bundling: `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"target": "ESNext"` |

## Provided Configurations

| Config | Purpose | Extended By |
|---|---|---|
| `base.json` | Core TypeScript settings — strict mode, path aliases, JSX | All packages |
| `vite.json` | Vite-optimized settings — ESNext target, bundler resolution | All MFE apps |

## Usage

```json
// In any app's tsconfig.json
{
  "extends": "@healthcare/tsconfig/vite.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}

// In any package's tsconfig.json
{
  "extends": "@healthcare/tsconfig/base.json",
  "include": ["src"]
}
```

## Key Settings

- **Strict mode** enabled (`strict: true`)
- **ESNext target** for modern browser output
- **Bundler module resolution** (Vite-compatible)
- **JSX** set to `react-jsx` (automatic React runtime)
- **Path aliases** support via `@/*` convention
