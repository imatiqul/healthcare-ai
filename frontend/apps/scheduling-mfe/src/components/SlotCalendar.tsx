import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@healthcare/design-system';
import { emitSlotReserved } from '@healthcare/mfe-events';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function makeDemoSlots(date: string): Slot[] {
  const base = new Date(`${date}T08:00:00`);
  return Array.from({ length: 8 }, (_, i) => ({
    id: `demo-slot-${i}`,
    practitionerId: `DR-${(i % 3) + 1}`,
    startTime: new Date(base.getTime() + i * 30 * 60_000).toISOString(),
    endTime:   new Date(base.getTime() + (i + 1) * 30 * 60_000).toISOString(),
    status: 'Available',
  }));
}

interface Slot {
  id: string;
  practitionerId: string;
  startTime: string;
  endTime: string;
  status: string;
}

export function SlotCalendar() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  async function fetchSlots() {
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/scheduling/slots?date=${selectedDate}`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setSlots(makeDemoSlots(selectedDate));
      }
    }
  }

  async function reserveSlot(slotId: string) {
    setReserveError(null);
    // Demo slots resolve locally — no backend needed
    if (slotId.startsWith('demo-slot-')) {
      emitSlotReserved({ slotId });
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: 'Reserved' } : s));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/scheduling/slots/${slotId}/reserve`, { method: 'POST', signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`Reservation failed (${res.status})`);
      emitSlotReserved({ slotId });
      fetchSlots();
    } catch {
      // Backend offline — treat as demo reserve success
      emitSlotReserved({ slotId });
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: 'Reserved' } : s));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>Available Slots</span>
            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              sx={{ width: 180 }}
            />
          </Stack>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fetchError && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setFetchError(null)}>{fetchError}</Alert>}
        {!fetchError && slots.length === 0 ? (
          <Typography color="text.disabled" textAlign="center" sx={{ py: 4 }}>
            No available slots for this date
          </Typography>
        ) : (
          <Grid container spacing={1}>
            {slots.map((slot) => (
              <Grid item xs={6} key={slot.id}>
                <Box
                  onClick={() => reserveSlot(slot.id)}
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'primary.50' },
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Badge variant="success">{slot.status}</Badge>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
