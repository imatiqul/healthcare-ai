import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import StarIcon from '@mui/icons-material/Star';

const FEATURES = [
  'Voice Intake',
  'AI Triage',
  'Scheduling',
  'Revenue Cycle',
  'Population Health',
  'Copilot Guide',
];

interface OverallFeedbackDialogProps {
  open: boolean;
  onSubmit: (npsScore: number, featurePriorities: string[], comment: string) => void;
}

export function OverallFeedbackDialog({ open, onSubmit }: OverallFeedbackDialogProps) {
  const [nps, setNps] = useState<number | null>(null);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const togglePriority = (feature: string) => {
    setPriorities(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const handleSubmit = () => {
    if (nps !== null) {
      onSubmit(nps, priorities, comment);
    }
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold">Overall Feedback</Typography>
        <Typography variant="body2" color="text.secondary">
          Thank you for exploring HealthQ Copilot!
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 1, mt: 1, textAlign: 'center' }}>
          How likely are you to recommend this platform? (0-10)
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[...Array(11)].map((_, i) => (
              <Chip
                key={i}
                label={i}
                variant={nps === i ? 'filled' : 'outlined'}
                color={nps === i ? (i >= 9 ? 'success' : i >= 7 ? 'primary' : 'warning') : 'default'}
                onClick={() => setNps(i)}
                sx={{ cursor: 'pointer', minWidth: 36 }}
              />
            ))}
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mb: 1, textAlign: 'center' }}>
          Which features are most valuable? (select all that apply)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 3 }}>
          {FEATURES.map(f => (
            <Chip
              key={f}
              label={f}
              icon={<StarIcon sx={{ fontSize: 16 }} />}
              variant={priorities.includes(f) ? 'filled' : 'outlined'}
              color={priorities.includes(f) ? 'primary' : 'default'}
              onClick={() => togglePriority(f)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Any additional comments, suggestions, or questions?"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={nps === null}
          sx={{ px: 4 }}
        >
          Complete Demo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
