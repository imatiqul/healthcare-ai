/**
 * OfflineIndicator — sticky top banner shown whenever the browser loses
 * network connectivity.  Disappears automatically when connectivity returns.
 *
 * No localStorage — purely event-driven state.
 */
import { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import WifiOffIcon from '@mui/icons-material/WifiOff';

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <Alert
      icon={<WifiOffIcon fontSize="inherit" />}
      severity="error"
      variant="filled"
      sx={{
        borderRadius: 0,
        py: 0.5,
        '& .MuiAlert-message': { fontWeight: 500 },
      }}
      data-testid="offline-indicator"
    >
      You are offline — some features may be unavailable until connectivity is restored.
    </Alert>
  );
}
