import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { Button } from '@healthcare/design-system';
import { useAuth } from '@healthcare/auth-client';

export function TopNav() {
  const { session, isAuthenticated, signIn, signOut } = useAuth();

  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="body2" fontWeight={500} color="text.secondary">
          Healthcare AI Platform
        </Typography>
        {isAuthenticated && session ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
              {session.name.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2">{session.name}</Typography>
            <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
          </Stack>
        ) : (
          <Button variant="ghost" size="sm" onClick={signIn}>Sign In</Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
