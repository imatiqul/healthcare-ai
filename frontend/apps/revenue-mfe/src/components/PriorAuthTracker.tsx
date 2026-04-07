import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@healthcare/design-system';

interface PriorAuth {
  id: string;
  patientName: string;
  procedure: string;
  status: 'draft' | 'submitted' | 'approved' | 'denied';
  submittedAt?: string;
}

export function PriorAuthTracker() {
  const [auths] = useState<PriorAuth[]>([]);

  function getStatusVariant(status: string) {
    switch (status) {
      case 'approved': return 'success' as const;
      case 'denied': return 'danger' as const;
      case 'submitted': return 'warning' as const;
      default: return 'secondary' as const;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prior Authorization Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        {auths.length === 0 ? (
          <Typography color="text.disabled" textAlign="center" sx={{ py: 4 }}>
            No prior authorizations
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {auths.map((auth) => (
              <Box key={auth.id} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight="medium">{auth.patientName}</Typography>
                    <Typography variant="caption" color="text.secondary">{auth.procedure}</Typography>
                  </Box>
                  <Badge variant={getStatusVariant(auth.status)}>{auth.status}</Badge>
                </Stack>
                {auth.submittedAt && (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                    Submitted: {new Date(auth.submittedAt).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
