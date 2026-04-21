import { create } from 'zustand';

export interface ActivePatient {
  id:         string;
  name?:      string;
  riskLevel?: string; // 'Critical' | 'High' | 'Low'
}

export interface GlobalState {
  currentPatientId: string | null;
  activeSessionId:  string | null;
  userRole:         string | null;
  activePatient:    ActivePatient | null;       // Phase 49
  setSession:       (id: string | null) => void;
  setPatient:       (id: string | null) => void;
  setUserRole:      (role: string | null) => void;
  setActivePatient: (patient: ActivePatient | null) => void; // Phase 49
  clearActivePatient: () => void;                            // Phase 49
}

export const useGlobalStore = create<GlobalState>((set) => ({
  currentPatientId: null,
  activeSessionId:  null,
  userRole:         null,
  activePatient:    null,
  setSession:       (id)      => set({ activeSessionId: id }),
  setPatient:       (id)      => set({ currentPatientId: id }),
  setUserRole:      (role)    => set({ userRole: role }),
  setActivePatient: (patient) => set({
    activePatient:    patient,
    currentPatientId: patient?.id ?? null,
  }),
  clearActivePatient: () => set({ activePatient: null, currentPatientId: null }),
}));
