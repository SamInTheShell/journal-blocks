import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useJournal } from '../../hooks/useJournal';
import JournalSidebar from '../layout/JournalSidebar';
import JournalTabs from '../layout/JournalTabs';
import StatusBar from '../layout/StatusBar';

export default function EditorPage() {
  const { state } = useJournal();
  const navigate = useNavigate();

  // Redirect to welcome if no journal is loaded
  useEffect(() => {
    if (!state.currentJournal || !state.currentFilePath) {
      navigate('/');
    }
  }, [state.currentJournal, state.currentFilePath, navigate]);

  if (!state.currentJournal) {
    return null; // Will redirect to welcome page
  }

  return (
    <>
      <Box sx={{ display: 'flex', height: '100vh', pb: '32px' }}>
        <JournalSidebar />
        <JournalTabs />
      </Box>
      <StatusBar />
    </>
  );
}