export interface AuthConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export const authConfig: AuthConfig = {
  authority: import.meta.env?.VITE_AZURE_AD_ISSUER ?? '',
  clientId: import.meta.env?.VITE_AZURE_AD_CLIENT_ID ?? '',
  redirectUri: import.meta.env?.VITE_REDIRECT_URI ?? window.location.origin,
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};
