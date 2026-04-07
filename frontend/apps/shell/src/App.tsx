import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import Dashboard from './pages/Dashboard';

const VoicePage = lazy(() => import('voice/VoiceSessionController').then(m => ({ default: m.VoiceSessionController })));
const TriagePage = lazy(() => import('triage/TriageViewer').then(m => ({ default: m.TriageViewer })));
const SchedulingPage = lazy(() => import('scheduling/SlotCalendar').then(m => ({ default: m.SlotCalendar })));
const PopHealthPage = lazy(() => import('pophealth/RiskPanel').then(m => ({ default: m.RiskPanel })));
const RevenuePage = lazy(() => import('revenue/CodingQueue').then(m => ({ default: m.CodingQueue })));

function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopNav />
        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/voice" element={<VoicePage />} />
              <Route path="/triage" element={<TriagePage />} />
              <Route path="/scheduling" element={<SchedulingPage />} />
              <Route path="/population-health" element={<PopHealthPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
            </Routes>
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
