/**
 * Global store federated from the shell.
 * Remotes can consume this via:
 *   import { useGlobalStore } from 'shell/store';
 *
 * The store is a Zustand singleton shared across all MFEs through
 * the `zustand: { singleton: true }` shared dependency in Module Federation.
 */
export { useGlobalStore } from './index';
export type { GlobalState } from './index';
