import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import BiotechIcon from '@mui/icons-material/Biotech';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MedicationIcon from '@mui/icons-material/Medication';
import { EncounterList } from './components/EncounterList';
import { MedicationPanel } from './components/MedicationPanel';
import { AllergyPanel } from './components/AllergyPanel';
import { ProblemListPanel } from './components/ProblemListPanel';
import { ImmunizationPanel } from './components/ImmunizationPanel';
import { FhirObservationViewer } from './components/FhirObservationViewer';
import { LabDeltaFlagsPanel } from './components/LabDeltaFlagsPanel';
import { FhirEverythingViewer } from './components/FhirEverythingViewer';
import { DrugInteractionChecker } from './components/DrugInteractionChecker';
import { PatientSummaryCard } from './components/PatientSummaryCard';

const DEMO_PATIENTS = [
  { id: 'PAT-00142', label: 'PAT-00142 · Diabetes / HTN' },
  { id: 'PAT-00278', label: 'PAT-00278 · Cardiac' },
  { id: 'PAT-00315', label: 'PAT-00315 · Oncology' },
];

export default function App() {
  const [patientId, setPatientId] = useState(DEMO_PATIENTS[0].id);
  const [searchInput, setSearchInput] = useState(DEMO_PATIENTS[0].id);
  const [activeTab, setActiveTab] = useState(0);

  function handleSearch() {
    const trimmed = searchInput.trim();
    if (trimmed) setPatientId(trimmed);
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Clinical Encounters
      </Typography>

      {/* ── Shared Patient Context Bar ── */}
      <Stack
        direction="row" spacing={2} alignItems="center" flexWrap="wrap" mb={3}
        sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2 }}
      >
        <PersonIcon color="action" />
        <TextField
          label="Patient ID"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. PAT-00142"
          sx={{ minWidth: 220 }}
        />
        <Button variant="contained" size="small" onClick={handleSearch} disabled={!searchInput.trim()}>
          Load
        </Button>
        <Divider orientation="vertical" flexItem />
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          Quick select:
        </Typography>
        {DEMO_PATIENTS.map((p) => (
          <Chip
            key={p.id}
            label={p.label}
            size="small"
            onClick={() => { setSearchInput(p.id); setPatientId(p.id); }}
            color={patientId === p.id ? 'primary' : 'default'}
            variant={patientId === p.id ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      {/* ── Patient summary at-a-glance ── */}
      <PatientSummaryCard patientId={patientId} />

      {/* ── Tab Navigation ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v: number) => setActiveTab(v)} aria-label="encounters tabs">
          <Tab icon={<MedicalServicesIcon fontSize="small" />} iconPosition="start" label="Clinical Summary" />
          <Tab icon={<BiotechIcon fontSize="small" />}         iconPosition="start" label="Lab & Observations" />
          <Tab icon={<FolderOpenIcon fontSize="small" />}      iconPosition="start" label="Full Record" />
          <Tab icon={<MedicationIcon fontSize="small" />}      iconPosition="start" label="Drug Safety" />
        </Tabs>
      </Box>

      {/* ── Tab 0: Clinical Summary ── */}
      {activeTab === 0 && (
        <Stack gap={3}>
          <EncounterList patientId={patientId} />
          <MedicationPanel patientId={patientId} />
          <AllergyPanel patientId={patientId} />
          <ProblemListPanel patientId={patientId} />
          <ImmunizationPanel patientId={patientId} />
        </Stack>
      )}

      {/* ── Tab 1: Lab & Observations ── */}
      {activeTab === 1 && (
        <Stack gap={3}>
          <LabDeltaFlagsPanel patientId={patientId} />
          <FhirObservationViewer patientId={patientId} />
        </Stack>
      )}

      {/* ── Tab 2: Full FHIR Record ── */}
      {activeTab === 2 && (
        <FhirEverythingViewer patientId={patientId} />
      )}

      {/* ── Tab 3: Drug Safety ── */}
      {activeTab === 3 && (
        <DrugInteractionChecker />
      )}
    </Box>
  );
}
