import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { EncounterList } from './components/EncounterList';
import { MedicationPanel } from './components/MedicationPanel';
import { AllergyPanel } from './components/AllergyPanel';
import { ProblemListPanel } from './components/ProblemListPanel';
import { ImmunizationPanel } from './components/ImmunizationPanel';

export default function App() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Clinical Encounters
      </Typography>
      <EncounterList />
      <Divider sx={{ my: 3 }} />
      <Stack gap={3}>
        <MedicationPanel />
        <AllergyPanel />
        <ProblemListPanel />
        <ImmunizationPanel />
      </Stack>
    </Box>
  );
}
