import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@healthcare/design-system';
import { onSlotReserved, emitBookingCreated } from '@healthcare/mfe-events';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function BookingForm() {
  const [slotId, setSlotId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [practitionerId, setPractitionerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const off = onSlotReserved((e) => {
      if (e.detail?.slotId) setSlotId(e.detail.slotId);
    });
    return off;
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/v1/scheduling/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, patientId, practitionerId }),
      });
      emitBookingCreated({ slotId, patientId });
      setSlotId('');
      setPatientId('');
      setPractitionerId('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Appointment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Input value={slotId} onChange={(e) => setSlotId(e.target.value)} placeholder="Select a slot" label="Slot ID" required />
            <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Patient ID" label="Patient ID" required />
            <Input value={practitionerId} onChange={(e) => setPractitionerId(e.target.value)} placeholder="Practitioner ID" label="Practitioner ID" required />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Booking...' : 'Book Appointment'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
