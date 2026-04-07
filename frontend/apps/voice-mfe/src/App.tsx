import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { VoiceSessionController } from './components/VoiceSessionController';

export default function App() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Voice Sessions
      </Typography>
      <VoiceSessionController />
    </Box>
  );
}
