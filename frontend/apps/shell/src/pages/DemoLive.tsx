import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AlertTitle from '@mui/material/AlertTitle';
import { FeedbackDialog } from '../components/FeedbackDialog';
import { OverallFeedbackDialog } from '../components/OverallFeedbackDialog';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const DEMO_API = `${API_BASE}/api/v1/agents/demo`;

const STEP_LABELS = [
  'Welcome',
  'Voice Intake',
  'AI Triage',
  'Scheduling',
  'Revenue Cycle',
  'Population Health',
];

// Per-step action hints shown to the demo attendee while offline
const STEP_HINTS: Record<number, string> = {
  0: 'Explore the dashboard — your clinical KPIs show live triage, scheduling, and revenue data. Click any card to jump to that section.',
  1: 'Click ▶ Record and speak: “Patient reports chest pain radiating to the left arm, 8/10 severity, started 2 hours ago.” Watch real-time transcription appear.',
  2: 'Select a P1 case from the queue, read the AI reasoning, then click Claim to assign it to yourself for human review.',
  3: 'Use the quick-select chips to pick Alice Morgan (PAT-00142), then book a follow-up appointment slot in the calendar.',
  4: 'Review the pending ICD-10 coding jobs — click Approve Codes to confirm the AI suggestion and advance the claim to Submitted.',
  5: 'Navigate to HEDIS to see the Comprehensive Diabetes Care gap for PAT-00142, then click Generate Care Plan.',
};

const STEP_ROUTES: Record<string, string> = {
  Welcome: '/',
  VoiceIntake: '/voice',
  AiTriage: '/triage',
  Scheduling: '/scheduling',
  RevenueCycle: '/revenue',
  PopulationHealth: '/population-health',
};

interface StepInfo {
  step: string;
  title: string;
  feedbackQuestion: string;
  feedbackTags: string[];
}

interface DemoState {
  sessionId: string;
  guideSessionId: string;
  currentStep: string;
  narration: string;
  stepInfo: StepInfo | null;
  clientName: string;
  company: string;
}

// Used when /demo/live is accessed directly without a session (e.g. coverage tests,
// shareable links, deep-links from CI). Renders a preview so the URL stays at
// /demo/live rather than bouncing back to /demo.
const FALLBACK_DEMO_STATE: DemoState = {
  sessionId: 'demo-preview',
  guideSessionId: 'guide-preview',
  currentStep: 'Welcome',
  narration:
    'Welcome to HealthQ Copilot! This AI-powered clinical platform is your intelligent copilot for care — ' +
    'from voice intake and AI triage through scheduling, revenue cycle, and population health. ' +
    "Let's explore the future of healthcare together.",
  stepInfo: {
    step: 'Welcome',
    title: 'Welcome',
    feedbackQuestion: 'How clear was this introduction?',
    feedbackTags: ['Clear', 'Relevant', 'Engaging'],
  },
  clientName: 'Guest',
  company: 'HealthQ',
};

export default function DemoLive() {
  const navigate = useNavigate();
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [narration, setNarration] = useState('');
  const [stepInfo, setStepInfo] = useState<StepInfo | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showOverall, setShowOverall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('demo');
    if (!stored) {
      // No active demo session — render a preview fallback so the page stays at
      // /demo/live (supports E2E route coverage tests and shareable deep-links).
      setDemo(FALLBACK_DEMO_STATE);
      setNarration(FALLBACK_DEMO_STATE.narration);
      setStepInfo(FALLBACK_DEMO_STATE.stepInfo);
      return;
    }
    const state: DemoState = JSON.parse(stored);
    setDemo(state);
    setNarration(state.narration);
    setStepInfo(state.stepInfo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advanceStep = useCallback(async () => {
    if (!demo) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${DEMO_API}/${demo.sessionId}/next`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to advance step');
      const data = await res.json();

      if (data.isComplete) {
        setShowOverall(true);
        setNarration(data.narration);
      } else {
        const newStep = STEP_LABELS.indexOf(data.stepInfo?.title?.replace(' Demo', '') ?? '') + 1;
        setActiveStep(newStep > 0 ? newStep : activeStep + 1);
        setNarration(data.narration);
        setStepInfo(data.stepInfo);
      }
    } catch {
      // Backend offline — advance demo step locally with canned narration
      const STEP_NARRATIONS = [
        'Voice Intake: The AI listens in real time, capturing structured clinical data from natural conversation — no typing required.',
        'AI Triage: Semantic Kernel agents score urgency, suggest ICD-10 codes, and flag escalation needs within seconds.',
        'Scheduling: Intelligent slot matching and waitlist management ensure optimal access for every patient.',
        'Revenue Cycle: Automated coding and prior-auth tracking reduce claim denials and accelerate reimbursement.',
        'Population Health: Predictive risk stratification and HEDIS gap analysis keep your entire patient panel on track.',
        'Thank you for exploring HealthQ Copilot — the AI copilot for modern clinical workflows!',
      ];
      const nextStep = activeStep + 1;
      if (nextStep >= STEP_LABELS.length) {
        setShowOverall(true);
        setNarration(STEP_NARRATIONS[STEP_NARRATIONS.length - 1]);
        setCompleted(true);
      } else {
        setActiveStep(nextStep);
        setNarration(STEP_NARRATIONS[Math.min(nextStep - 1, STEP_NARRATIONS.length - 2)]);
        setStepInfo(null);
      }
    } finally {
      setLoading(false);
    }
  }, [demo, activeStep]);

  const submitFeedback = useCallback(async (rating: number, tags: string[], comment: string) => {
    if (!demo || !stepInfo) return;
    setShowFeedback(false);
    try {
      await fetch(`${DEMO_API}/${demo.sessionId}/feedback`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepInfo.step, rating, tags, comment }),
      });
    } catch {
      // Non-critical — continue the demo
    }
    await advanceStep();
  }, [demo, stepInfo, advanceStep]);

  const skipFeedback = useCallback(async () => {
    setShowFeedback(false);
    await advanceStep();
  }, [advanceStep]);

  const completeDemo = useCallback(async (nps: number, priorities: string[], comment: string) => {
    if (!demo) return;
    setShowOverall(false);
    try {
      await fetch(`${DEMO_API}/${demo.sessionId}/complete`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npsScore: nps, featurePriorities: priorities, comment }),
      });
      setCompleted(true);
      sessionStorage.removeItem('demo');
    } catch {
      setError('Could not submit final feedback.');
    }
  }, [demo]);

  if (!demo) return null;

  if (completed) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}>
        <Card sx={{ maxWidth: 500, textAlign: 'center', p: 3, borderRadius: 3, boxShadow: 6 }}>
          <CardContent>
            <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>Demo Complete!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Thank you, {demo.clientName}! Your feedback helps us build a better platform.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/demo')}>
              Start Another Demo
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Progress bar */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6" component="h1" fontWeight="bold" sx={{ flex: 1 }}>
            HealthQ Copilot Demo — {demo.clientName} ({demo.company})
          </Typography>
          <Chip label={`Step ${activeStep + 1} of 6`} color="primary" size="small" />
        </Box>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEP_LABELS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <LinearProgress
          variant="determinate"
          value={((activeStep + 1) / 6) * 100}
          sx={{ mt: 1, height: 6, borderRadius: 3 }}
        />
      </Paper>

      {/* Main content area */}
      <Box sx={{ flex: 1, p: 3, maxWidth: 900, mx: 'auto', width: '100%' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* AI Narration card */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <SmartToyIcon color="primary" sx={{ mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  AI Copilot Narration
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {narration}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Navigation hint */}
        {stepInfo && STEP_ROUTES[stepInfo.step] && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Explore this module:</strong> In a full deployment, this step would navigate to{' '}
            <strong>{STEP_ROUTES[stepInfo.step]}</strong> to see the live feature.
          </Alert>
        )}

        {/* Offline step action hint */}
        {!stepInfo && STEP_HINTS[activeStep] !== undefined && (
          <Alert severity="info" icon={<LightbulbIcon />} sx={{ mb: 3 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Try this</AlertTitle>
            {STEP_HINTS[activeStep]}
          </Alert>
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<NavigateNextIcon />}
            onClick={() => setShowFeedback(true)}
            disabled={loading}
            sx={{ px: 4 }}
          >
            {loading ? 'Loading...' : 'Rate & Continue'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={advanceStep}
            disabled={loading}
          >
            Skip to Next
          </Button>
        </Box>
      </Box>

      {/* Feedback dialogs */}
      {stepInfo && (
        <FeedbackDialog
          open={showFeedback}
          question={stepInfo.feedbackQuestion}
          tags={stepInfo.feedbackTags}
          onSubmit={submitFeedback}
          onSkip={skipFeedback}
        />
      )}
      <OverallFeedbackDialog
        open={showOverall}
        onSubmit={completeDemo}
      />
    </Box>
  );
}
