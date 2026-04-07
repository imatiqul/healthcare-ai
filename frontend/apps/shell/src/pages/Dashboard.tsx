import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Card, CardContent } from '@healthcare/design-system';

const stats = [
  { label: 'Active Encounters', value: '24', color: 'primary.main' },
  { label: 'Pending Triage', value: '8', color: 'warning.main' },
  { label: 'Scheduled Today', value: '42', color: 'success.main' },
  { label: 'Open Care Gaps', value: '156', color: 'error.main' },
  { label: 'Coding Queue', value: '19', color: 'secondary.main' },
  { label: 'Prior Auths Pending', value: '7', color: 'info.main' },
];

export default function Dashboard() {
  return (
    <>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} key={stat.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
