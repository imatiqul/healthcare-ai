import { create } from 'zustand';

export interface GlobalState {
  currentPatientId: string | null;
  activeSessionId: string | null;
  userRole: string | null;
  setSession: (id: string | null) => void;
  setPatient: (id: string | null) => void;
  setUserRole: (role: string | null) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  currentPatientId: null,
  activeSessionId: null,
  userRole: null,
  setSession: (id) => set({ activeSessionId: id }),
  setPatient: (id) => set({ currentPatientId: id }),
  setUserRole: (role) => set({ userRole: role }),
}));
