import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/shell',
  'apps/triage-mfe',
  'apps/voice-mfe',
  'apps/scheduling-mfe',
  'apps/pophealth-mfe',
  'apps/revenue-mfe',
  'apps/encounters-mfe',
  'apps/engagement-mfe',
]);
