import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import Tooltip from '@mui/material/Tooltip';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MedicationIcon from '@mui/icons-material/Medication';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

// ── Action definitions ────────────────────────────────────────────────────────

interface QuickAction {
  name:  string;
  icon:  React.ReactNode;
  href:  string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { name: 'Review Triage Queue',     icon: <SmartToyIcon />,      href: '/triage',           color: '#f59e0b' },
  { name: 'Book Appointment',        icon: <CalendarMonthIcon />,  href: '/scheduling',       color: '#3b82f6' },
  { name: 'Drug Interactions',       icon: <MedicationIcon />,     href: '/encounters',       color: '#8b5cf6' },
  { name: 'Population Health',       icon: <MonitorHeartIcon />,   href: '/population-health',color: '#ef4444' },
  { name: 'Notification Center',     icon: <NotificationsIcon />,  href: '/notifications',    color: '#10b981' },
  { name: 'Patient Portal',          icon: <PersonSearchIcon />,   href: '/patient-portal',   color: '#0ea5e9' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickActionsSpeedDial() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleAction = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <Tooltip title={open ? '' : 'Quick Actions'} placement="left">
      <SpeedDial
        ariaLabel="Quick actions speed dial"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: (theme) => theme.zIndex.speedDial,
          '& .MuiSpeedDial-fab': {
            width: 48,
            height: 48,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          },
        }}
        icon={<SpeedDialIcon icon={<AddIcon />} openIcon={<CloseIcon />} />}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        direction="up"
      >
        {QUICK_ACTIONS.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen
            onClick={() => handleAction(action.href)}
            FabProps={{
              size: 'small',
              sx: {
                bgcolor: action.color,
                color: 'white',
                '&:hover': { bgcolor: action.color, filter: 'brightness(1.1)' },
              },
            }}
          />
        ))}
      </SpeedDial>
    </Tooltip>
  );
}
