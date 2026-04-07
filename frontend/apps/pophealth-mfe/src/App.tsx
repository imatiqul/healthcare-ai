import Grid from '@mui/material/Grid';
import { RiskPanel } from './components/RiskPanel';
import { CareGapList } from './components/CareGapList';

export default function App() {
  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      <Grid item xs={12} md={6}>
        <RiskPanel />
      </Grid>
      <Grid item xs={12} md={6}>
        <CareGapList />
      </Grid>
    </Grid>
  );
}
