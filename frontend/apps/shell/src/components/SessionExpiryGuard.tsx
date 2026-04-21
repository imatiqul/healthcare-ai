import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@healthcare/auth-client';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';

// ── Constants ────────────────────────────────────────────────────────────────

const WARN_BEFORE_MS  = 5 * 60 * 1000; // Show warning 5 minutes before expiry
const CHECK_INTERVAL_MS = 30_000;       // Re-check every 30 seconds

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionExpiryGuard() {
  const { session, isAuthenticated, signIn, signOut } = useAuth();
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // Use refs to avoid stale closure inside the interval without adding
  // signIn/signOut to the effect deps (which could be unstable references)
  const signInRef  = useRef(signIn);
  const signOutRef = useRef(signOut);
  signInRef.current  = signIn;
  signOutRef.current = signOut;

  useEffect(() => {
    if (!isAuthenticated || !session?.exp) return;

    const exp = session.exp;

    const check = () => {
      const msLeft = (exp * 1000) - Date.now();
      if (msLeft <= 0) {
        signOutRef.current();
        return;
      }
      if (msLeft <= WARN_BEFORE_MS) {
        setMinutesLeft(Math.ceil(msLeft / 60_000));
        setOpen(true);
      }
    };

    check(); // run immediately on mount / session change
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, session?.exp]);

  const handleExtend  = () => { setOpen(false); signInRef.current(); };
  const handleSignOut = () => { setOpen(false); signOutRef.current(); };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      aria-labelledby="session-expiry-title"
    >
      <DialogTitle id="session-expiry-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TimerOutlinedIcon color="warning" />
        Session Expiring Soon
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your session will expire in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Extend your session to continue working, or sign out to save your progress.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={handleSignOut} color="inherit">
          Sign Out
        </Button>
        <Button onClick={handleExtend} variant="contained" color="primary">
          Extend Session
        </Button>
      </DialogActions>
    </Dialog>
  );
}
