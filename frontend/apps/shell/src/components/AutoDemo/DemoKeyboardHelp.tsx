/**
 * Phase 63 — DemoKeyboardHelp
 *
 * A compact overlay triggered by pressing '?' during a demo.
 * Lists every keyboard shortcut available to the presenter.
 * Auto-dismisses after 8 s or on any key / click.
 */
import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardIcon from '@mui/icons-material/Keyboard';

interface DemoKeyboardHelpProps {
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string[]; description: string }> = [
  { keys: ['Space'],     description: 'Pause / Resume demo' },
  { keys: ['→'],         description: 'Next scene' },
  { keys: ['←'],         description: 'Previous scene' },
  { keys: ['1',' – ','8'], description: 'Jump to workflow 1–8' },
  { keys: ['Esc'],       description: 'Exit demo' },
  { keys: ['?'],         description: 'Show this shortcut guide' },
];

export function DemoKeyboardHelp({ onClose }: DemoKeyboardHelpProps) {
  // Auto-dismiss after 8 s
  useEffect(() => {
    const timer = setTimeout(onClose, 8_000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Dismiss on any keypress or outside click
  useEffect(() => {
    const dismiss = () => onClose();
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [onClose]);

  return (
    <Box
      onClick={onClose}
      sx={{
        position:       'fixed',
        inset:          0,
        zIndex:         3000,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        bgcolor:        'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        animation:      'hq-fade-in 0.2s ease',
        '@keyframes hq-fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      <Box
        onClick={e => e.stopPropagation()}
        sx={{
          bgcolor:      'rgba(15,20,35,0.96)',
          border:       '1px solid rgba(255,255,255,0.14)',
          borderRadius: 3,
          boxShadow:    '0 16px 48px rgba(0,0,0,0.6)',
          p:            3,
          minWidth:     320,
          maxWidth:     400,
          color:        '#fff',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyboardIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
            <Typography variant="subtitle2" fontWeight={700}>
              Demo Keyboard Shortcuts
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

        {/* Shortcuts */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
          {SHORTCUTS.map(({ keys, description }) => (
            <Box key={description} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                {description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                {keys.map((k, i) => (
                  k === ' – ' ? (
                    <Typography key={i} variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', mx: 0.2 }}>–</Typography>
                  ) : (
                    <Chip
                      key={i}
                      label={k}
                      size="small"
                      sx={{
                        height:          20,
                        fontSize:        '0.68rem',
                        fontWeight:      700,
                        fontFamily:      'monospace',
                        bgcolor:         'rgba(255,255,255,0.1)',
                        color:           '#fff',
                        border:          '1px solid rgba(255,255,255,0.2)',
                        borderRadius:    1,
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  )
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mt: 2, mb: 1.5 }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', textAlign: 'center' }}>
          Press any key or click to dismiss · auto-closes in 8 s
        </Typography>
      </Box>
    </Box>
  );
}
