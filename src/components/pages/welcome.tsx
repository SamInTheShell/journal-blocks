import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Book as BookIcon,
  Add as AddIcon,
  FolderOpen as FolderOpenIcon,
  Description as FileIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useJournal } from '../../hooks/useJournal';
import { useNavigate } from 'react-router-dom';

interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  filePath: string | null;
}

export default function WelcomePage() {
  const { state, openJournal, createJournal, loadRecentFiles, deleteRecentFile, clearRecentFiles } = useJournal();
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    loadRecentFiles();
  }, [loadRecentFiles]);

  // Navigate to editor when journal is loaded
  useEffect(() => {
    if (state.currentJournal && state.currentFilePath) {
      navigate('/editor');
    }
  }, [state.currentJournal, state.currentFilePath, navigate]);

  const handleOpenRecentFile = async (filePath: string) => {
    await openJournal(filePath);
  };

  const handleOpenNewFile = async () => {
    await openJournal();
  };

  const handleContextMenu = (event: React.MouseEvent, filePath: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      filePath,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteRecentFile = async (filePath: string) => {
    await deleteRecentFile(filePath);
    handleCloseContextMenu();
  };

  const handleClearAllRecentFiles = async () => {
    await clearRecentFiles();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativePath = (fullPath: string) => {
    // In Electron renderer, we don't have direct access to process.env
    // We'll just show the full path for now, or could implement via IPC
    if (fullPath.includes('/Users/') || fullPath.includes('/home/')) {
      const pathParts = fullPath.split('/');
      const userIndex = pathParts.findIndex(part => part === 'Users' || part === 'home');
      if (userIndex >= 0 && userIndex + 1 < pathParts.length) {
        return '~/' + pathParts.slice(userIndex + 2).join('/');
      }
    }
    return fullPath;
  };

  if (state.isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2,
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading journal...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
    }}>
      <Paper sx={{ 
        maxWidth: 800, 
        width: '100%',
        p: 4,
        borderRadius: 3,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <BookIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Journal Blocks
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Structured note-taking with hierarchical organization
          </Typography>
        </Box>

        {/* Error Display */}
        {state.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {state.error}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 4,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={createJournal}
            disabled={state.isLoading}
            size="large"
            sx={{ minWidth: 160 }}
          >
            New Journal
          </Button>
          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={handleOpenNewFile}
            disabled={state.isLoading}
            size="large"
            sx={{ minWidth: 160 }}
          >
            Open Journal
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Recent Files */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileIcon />
              Recent Journals
            </Typography>
            {state.recentFiles.length > 0 && (
              <Button
                startIcon={<ClearIcon />}
                onClick={handleClearAllRecentFiles}
                size="small"
                color="secondary"
              >
                Clear All
              </Button>
            )}
          </Box>
          
          {state.recentFiles.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary',
            }}>
              <Typography variant="body1">
                No recent journals found.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Create a new journal or open an existing one to get started.
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {state.recentFiles.map((file: { path: string; title: string; lastModified: string }) => (
                <ListItem key={file.path} disablePadding>
                  <ListItemButton
                    onClick={() => handleOpenRecentFile(file.path)}
                    onContextMenu={(e) => handleContextMenu(e, file.path)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <BookIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.title}
                      secondary={`${getRelativePath(file.path)} • Last modified: ${formatDate(file.lastModified)}`}
                    />
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, file.path);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Getting Started Tips */}
        <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.900', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Getting Started
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Create hierarchical notes with folders and entries
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Use rich text editing with drag & drop organization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Export individual entries to Markdown format
          </Typography>
        </Box>
      </Paper>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => contextMenu?.filePath && handleDeleteRecentFile(contextMenu.filePath)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove from recent</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
