import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@healthcare/design-system';

interface CodingItem {
  id: string;
  encounterId: string;
  patientName: string;
  suggestedCodes: string[];
  status: 'pending' | 'reviewed' | 'submitted';
}

export function CodingQueue() {
  const [items] = useState<CodingItem[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ICD-10 Coding Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Typography color="text.disabled" textAlign="center" sx={{ py: 4 }}>
            No encounters pending coding
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {items.map((item) => (
              <Box key={item.id} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">{item.patientName}</Typography>
                  <Badge variant={item.status === 'pending' ? 'warning' : item.status === 'reviewed' ? 'default' : 'success'}>
                    {item.status}
                  </Badge>
                </Stack>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1 }}>
                  {item.suggestedCodes.map((code) => (
                    <Badge key={code} variant="outline">{code}</Badge>
                  ))}
                </Stack>
                <Button size="sm" variant="outline">Review Codes</Button>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
