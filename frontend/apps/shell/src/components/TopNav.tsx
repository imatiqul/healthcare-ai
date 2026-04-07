import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Button } from '@healthcare/design-system';

export function TopNav() {
  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="body2" fontWeight={500} color="text.secondary">
          Healthcare AI Platform
        </Typography>
        <Button variant="ghost" size="sm">Sign In</Button>
      </Toolbar>
    </AppBar>
  );
}
