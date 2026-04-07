import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import { Button } from '@healthcare/design-system';

interface HitlEscalationModalProps {
  workflowId: string;
  onApprove: () => void;
  onClose: () => void;
}

export function HitlEscalationModal({ workflowId, onApprove, onClose }: HitlEscalationModalProps) {
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: 'error.main' }}>Human Review Required</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This triage workflow requires human approval before proceeding.
          The AI agent has flagged this case as requiring clinical oversight.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Workflow: {workflowId}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onApprove}>Approve & Continue</Button>
      </DialogActions>
    </Dialog>
  );
}
