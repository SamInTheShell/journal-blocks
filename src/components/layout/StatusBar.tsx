import React from 'react';
import { Box, Typography } from '@mui/material';
import { useJournal } from '../../hooks/useJournal';

export default function StatusBar() {
  const { state } = useJournal();
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  // Monitor journal changes for save status
  React.useEffect(() => {
    if (state.currentJournal) {
      setSaveStatus('saving');
      
      // Simulate save completion after a short delay
      const timer = setTimeout(() => {
        setSaveStatus('saved');
        setLastSaved(new Date());
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.currentJournal]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusText = () => {
    if (saveStatus === 'saving') return '● Saving...';
    if (saveStatus === 'error') return '⚠ Error saving';
    if (lastSaved) return `✓ Saved at ${formatTime(lastSaved)}`;
    return '✓ Saved';
  };

  const getStatusColor = () => {
    if (saveStatus === 'saved') return 'success.main';
    if (saveStatus === 'saving') return 'warning.main';
    return 'error.main';
  };

  if (!state.currentJournal) {
    return null;
  }

  return (
    <Box sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 32,
      backgroundColor: 'background.paper',
      borderTop: 1,
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 2,
      zIndex: 1000,
    }}>
      <Typography variant="caption" color="text.secondary">
        {state.currentJournal.title}
      </Typography>
      
      <Typography 
        variant="caption" 
        color={getStatusColor()}
        sx={{ fontWeight: 500 }}
      >
        {getStatusText()}
      </Typography>
    </Box>
  );
}
