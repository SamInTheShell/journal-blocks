import React, { useEffect, useCallback } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as FileIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { useJournal } from '../../hooks/useJournal';
import JournalEditor from './JournalEditor';

export default function JournalTabs() {
  const { state, closeTab, setActiveTab } = useJournal();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleTabClose = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    closeTab(tabId);
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { openTabs, activeTabId } = state.editorState;
    
    if (!openTabs.length) return;

    const currentIndex = openTabs.findIndex(tab => tab.id === activeTabId);
    
    // Tab switching shortcuts
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
      if (event.key === 'Tab') {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % openTabs.length;
        setActiveTab(openTabs[nextIndex].id);
      } else if (event.key === 'w') {
        event.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }
    } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Tab') {
      event.preventDefault();
      const prevIndex = currentIndex === 0 ? openTabs.length - 1 : currentIndex - 1;
      setActiveTab(openTabs[prevIndex].id);
    } else if (event.metaKey && (event.key === '[' || event.key === ']')) {
      event.preventDefault();
      if (event.key === '[') {
        const prevIndex = currentIndex === 0 ? openTabs.length - 1 : currentIndex - 1;
        setActiveTab(openTabs[prevIndex].id);
      } else {
        const nextIndex = (currentIndex + 1) % openTabs.length;
        setActiveTab(openTabs[nextIndex].id);
      }
    }
  }, [state.editorState, setActiveTab, closeTab]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const { openTabs, activeTabId } = state.editorState;

  if (openTabs.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 3,
          p: 4,
          textAlign: 'center',
        }}
      >
        <BookIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Box>
          <Typography variant="h4" gutterBottom color="text.secondary">
            Welcome to your Journal
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Select an entry from the sidebar to start editing, or create a new one.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Keyboard shortcuts:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 1, textAlign: 'left', display: 'inline-block' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
              <kbd>Ctrl + Tab</kbd> <span>Next tab</span>
              <kbd>Ctrl + Shift + Tab</kbd> <span>Previous tab</span>
              <kbd>Cmd + Shift + ]</kbd> <span>Next tab (Mac)</span>
              <kbd>Cmd + Shift + [</kbd> <span>Previous tab (Mac)</span>
              <kbd>Ctrl/Cmd + W</kbd> <span>Close tab</span>
            </Box>
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Tab Bar */}
      <Paper 
        square 
        elevation={0} 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          minHeight: 48,
        }}
      >
        <Tabs
          value={activeTabId || false}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 'normal',
              padding: '12px 8px',
              minWidth: 120,
              maxWidth: 200,
            },
          }}
        >
          {openTabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                  <FileIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {tab.title}
                    {tab.isDirty && ' •'}
                  </Typography>
                  <Box
                    component="span"
                    onClick={(e) => handleTabClose(tab.id, e)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      ml: 0.5,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </Box>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ flex: 1 }}>
        {openTabs.map((tab) => (
          <Box
            key={tab.id}
            sx={{
              display: tab.id === activeTabId ? 'flex' : 'none',
              height: '100%',
              flexDirection: 'column',
            }}
          >
            <JournalEditor entryId={tab.entryId} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
