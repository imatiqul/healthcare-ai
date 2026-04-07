export interface Resource {
  resourceType: string;
  id?: string;
  meta?: { versionId?: string; lastUpdated?: string };
}

export interface Patient extends Resource {
  resourceType: 'Patient';
  name?: Array<{ family?: string; given?: string[]; text?: string }>;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  identifier?: Array<{ system?: string; value?: string }>;
  telecom?: Array<{ system?: string; value?: string; use?: string }>;
  address?: Array<{ line?: string[]; city?: string; state?: string; postalCode?: string }>;
}

export interface Encounter extends Resource {
  resourceType: 'Encounter';
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  class: { code: string; display?: string };
  subject?: { reference: string };
  period?: { start?: string; end?: string };
  reasonCode?: Array<{ coding?: Array<{ system?: string; code?: string; display?: string }> }>;
}

export interface Appointment extends Resource {
  resourceType: 'Appointment';
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow';
  start?: string;
  end?: string;
  participant?: Array<{
    actor?: { reference: string; display?: string };
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
}

export interface Slot extends Resource {
  resourceType: 'Slot';
  status: 'busy' | 'free' | 'busy-unavailable' | 'busy-tentative';
  start: string;
  end: string;
  schedule?: { reference: string };
}

export interface Practitioner extends Resource {
  resourceType: 'Practitioner';
  name?: Array<{ family?: string; given?: string[]; prefix?: string[] }>;
  qualification?: Array<{ code: { coding: Array<{ system?: string; code?: string; display?: string }> } }>;
}

export interface Bundle<T extends Resource = Resource> extends Resource {
  resourceType: 'Bundle';
  type: 'searchset' | 'batch' | 'transaction' | 'collection';
  total?: number;
  entry?: Array<{ resource: T; fullUrl?: string }>;
}
