import Grid from '@mui/material/Grid';
import { CodingQueue } from './components/CodingQueue';
import { PriorAuthTracker } from './components/PriorAuthTracker';

export default function App() {
  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      <Grid item xs={12} md={6}>
        <CodingQueue />
      </Grid>
      <Grid item xs={12} md={6}>
        <PriorAuthTracker />
      </Grid>
    </Grid>
  );
}
