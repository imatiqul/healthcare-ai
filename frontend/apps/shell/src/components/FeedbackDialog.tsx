import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import StarIcon from '@mui/icons-material/Star';

interface FeedbackDialogProps {
  open: boolean;
  question: string;
  tags: string[];
  onSubmit: (rating: number, selectedTags: string[], comment: string) => void;
  onSkip: () => void;
}

export function FeedbackDialog({ open, question, tags, onSubmit, onSkip }: FeedbackDialogProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating) {
      onSubmit(rating, selectedTags, comment);
      setRating(null);
      setSelectedTags([]);
      setComment('');
    }
  };

  const handleSkip = () => {
    setRating(null);
    setSelectedTags([]);
    setComment('');
    onSkip();
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">Quick Feedback</Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>{question}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Rating
            size="large"
            value={rating}
            onChange={(_, v) => setRating(v)}
            emptyIcon={<StarIcon sx={{ opacity: 0.3 }} fontSize="inherit" />}
          />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 2 }}>
          {tags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
              color={selectedTags.includes(tag) ? 'primary' : 'default'}
              onClick={() => toggleTag(tag)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Any additional comments? (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
        <Button onClick={handleSkip} color="inherit">Skip</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!rating}>
          Submit & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
