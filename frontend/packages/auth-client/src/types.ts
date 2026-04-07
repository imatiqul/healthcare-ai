export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Patient' | 'Practitioner' | 'Admin';
  accessToken: string;
}
