import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { TriageViewer } from './components/TriageViewer';

export default function App() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        AI Triage Workflows
      </Typography>
      <TriageViewer />
    </Box>
  );
}
