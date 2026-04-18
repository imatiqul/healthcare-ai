import Grid from '@mui/material/Grid';
import { RiskPanel } from './components/RiskPanel';
import { CareGapList } from './components/CareGapList';
import { RiskDistributionChart } from './components/RiskDistributionChart';
import { PatientSearch } from './components/PatientSearch';

export default function App() {
  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      <Grid item xs={12} md={4}>
        <PatientSearch />
      </Grid>
      <Grid item xs={12} md={8}>
        <RiskDistributionChart />
      </Grid>
      <Grid item xs={12} md={6}>
        <RiskPanel />
      </Grid>
      <Grid item xs={12} md={6}>
        <CareGapList />
      </Grid>
    </Grid>
  );
}
