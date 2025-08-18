import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  Folder as FolderIcon,
  Description as FileIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  CreateNewFolder as NewFolderIcon,
  NoteAdd as NewEntryIcon,
} from '@mui/icons-material';
import { useJournal } from '../../hooks/useJournal';
import type { JournalItem, JournalEntry } from '../../types/journal';

interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  item: JournalItem | null;
}

interface DialogState {
  type: 'rename' | 'newEntry' | 'newFolder' | 'delete' | null;
  item: JournalItem | null;
  parentId: string | null;
}

interface DragState {
  draggedItem: JournalItem | null;
  draggedOver: string | null;
}

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 600;

export default function JournalSidebar() {
  const { 
    state, 
    openEntry, 
    addEntry, 
    addFolder, 
    renameItem, 
    deleteItem, 
    exportEntry, 
    setSidebarWidth, 
    moveItem,
    setSelectedFolder,
    toggleFolderExpanded
  } = useJournal();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: null, item: null, parentId: null });
  const [inputValue, setInputValue] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [dragState, setDragState] = useState<DragState>({ draggedItem: null, draggedOver: null });

  const handleContextMenu = (event: React.MouseEvent, item: JournalItem) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      item,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleOpenDialog = (type: DialogState['type'], item: JournalItem | null = null, parentId: string | null = null) => {
    setDialog({ type, item, parentId });
    setInputValue(item?.name || '');
    setContextMenu(null);
  };

  const handleCloseDialog = () => {
    setDialog({ type: null, item: null, parentId: null });
    setInputValue('');
  };

  const handleDialogSubmit = () => {
    if (!inputValue.trim()) return;

    switch (dialog.type) {
      case 'rename':
        if (dialog.item) {
          renameItem(dialog.item.id, inputValue.trim());
        }
        break;
      case 'newEntry':
        addEntry(dialog.parentId || undefined, inputValue.trim());
        break;
      case 'newFolder':
        addFolder(dialog.parentId || undefined, inputValue.trim());
        break;
    }
    handleCloseDialog();
  };

  const handleDelete = () => {
    if (dialog.item) {
      deleteItem(dialog.item.id);
    }
    handleCloseDialog();
  };

  const handleExport = async (item: JournalEntry) => {
    await exportEntry(item.id);
    handleCloseContextMenu();
  };

  const handleEntryClick = (entryId: string) => {
    openEntry(entryId);
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  // Get expanded folder IDs from journal data
  const getExpandedItems = useCallback((items: JournalItem[]): string[] => {
    const expanded: string[] = [];
    const traverseItems = (items: JournalItem[]) => {
      items.forEach(item => {
        if (item.type === 'folder') {
          if (item.expanded) {
            expanded.push(item.id);
          }
          traverseItems(item.children);
        }
      });
    };
    traverseItems(items);
    return expanded;
  }, []);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: JournalItem) => {
    setDragState({ draggedItem: item, draggedOver: null });
    e.dataTransfer.effectAllowed = 'move';
    // Don't set text data to prevent interference with BlockNote editor
    e.dataTransfer.setData('application/x-journal-item', item.id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering the root drop zone
    
    // Only allow drag over for folders
    const findItemById = (items: JournalItem[], id: string): JournalItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.type === 'folder' && item.children) {
          const found = findItemById(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const targetItem = state.currentJournal ? 
      findItemById(state.currentJournal.structure.children, targetId) : null;
    
    if (targetItem && targetItem.type === 'folder') {
      e.dataTransfer.dropEffect = 'move';
      setDragState(prev => ({ ...prev, draggedOver: targetId }));
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = () => {
    setDragState(prev => ({ ...prev, draggedOver: null }));
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering the root drop zone
    const { draggedItem } = dragState;
    
    if (draggedItem && draggedItem.id !== targetId) {
      // Find the target item to check its type
      const findItemById = (items: JournalItem[], id: string): JournalItem | null => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.type === 'folder' && item.children) {
            const found = findItemById(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const targetItem = state.currentJournal ? 
        findItemById(state.currentJournal.structure.children, targetId) : null;
      
      // Only allow dropping into folders, not onto entries
      if (targetItem && targetItem.type === 'folder') {
        moveItem(draggedItem.id, targetId);
      }
    }
    
    setDragState({ draggedItem: null, draggedOver: null });
  };

  const handleDragEnd = () => {
    setDragState({ draggedItem: null, draggedOver: null });
  };

  const renderTreeItems = (items: JournalItem[]): React.ReactNode[] => {
    // Sort items: folders first, then entries, both alphabetically
    const sortedItems = [...items].sort((a, b) => {
      // Folders come before entries
      if (a.type === 'folder' && b.type === 'entry') return -1;
      if (a.type === 'entry' && b.type === 'folder') return 1;
      
      // Within same type, sort alphabetically
      return a.name.localeCompare(b.name);
    });

    return sortedItems.map((item) => (
      <TreeItem
        key={item.id}
        itemId={item.id}
        label={
          <Box
            draggable
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 0.5,
              pr: 0,
              cursor: 'grab',
              backgroundColor: dragState.draggedOver === item.id ? 'rgba(144, 202, 249, 0.1)' : 'transparent',
              borderRadius: 1,
              '&:hover .more-button': {
                opacity: 1,
              },
              '&:active': {
                cursor: 'grabbing',
              },
            }}
            onContextMenu={(e) => handleContextMenu(e, item)}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
              // Make entire item clickable
              if (e.target === e.currentTarget || (e.target as Element).closest('.item-content')) {
                if (item.type === 'entry') {
                  handleEntryClick(item.id);
                } else {
                  handleFolderClick(item.id);
                }
              }
            }}
          >
            <Box 
              className="item-content"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexGrow: 1, 
                cursor: 'pointer',
                pointerEvents: 'none' // Let parent handle clicks
              }}
            >
              {item.type === 'folder' ? (
                <FolderIcon 
                  sx={{ 
                    mr: 1, 
                    fontSize: 18,
                    color: state.editorState.selectedFolderId === item.id ? 'primary.main' : 'inherit'
                  }} 
                />
              ) : (
                <FileIcon sx={{ mr: 1, fontSize: 18 }} />
              )}
              <Typography
                variant="body2"
                sx={{ 
                  flexGrow: 1,
                  color: state.editorState.selectedFolderId === item.id ? 'primary.main' : 'inherit',
                  fontWeight: state.editorState.selectedFolderId === item.id ? 'bold' : 'normal'
                }}
              >
                {item.name}
              </Typography>
            </Box>
            <IconButton
              className="more-button"
              size="small"
              sx={{ opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, item);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        {item.type === 'folder' && renderTreeItems(item.children)}
      </TreeItem>
    ));
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsResizing(true);
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = Math.min(Math.max(e.clientX, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);
    setSidebarWidth(newWidth);
  }, [isResizing, setSidebarWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!state.currentJournal) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          width: state.editorState.sidebarWidth,
          minWidth: SIDEBAR_MIN_WIDTH,
          maxWidth: SIDEBAR_MAX_WIDTH,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" noWrap>
              {state.currentJournal.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => handleOpenDialog('newEntry')}
                title="Add Entry"
              >
                <AddIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleOpenDialog('newFolder')}
                title="Add Folder"
              >
                <NewFolderIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Tree View */}
        <Box 
          sx={{ flex: 1, overflow: 'auto', p: 1 }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragState(prev => ({ ...prev, draggedOver: 'root' }));
          }}
          onDragLeave={(e) => {
            // Only clear if leaving the entire tree area
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragState(prev => ({ ...prev, draggedOver: null }));
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const { draggedItem } = dragState;
            
            if (draggedItem && draggedItem.id !== 'root') {
              moveItem(draggedItem.id, 'root');
            }
            
            setDragState({ draggedItem: null, draggedOver: null });
          }}
        >
          {state.currentJournal.structure.children.length === 0 ? (
            <Box sx={{ 
              p: 2, 
              textAlign: 'center', 
              color: 'text.secondary',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: dragState.draggedOver === 'root' ? 'rgba(144, 202, 249, 0.1)' : 'transparent',
              borderRadius: 1,
              border: dragState.draggedOver === 'root' ? '2px dashed rgba(144, 202, 249, 0.5)' : '2px dashed transparent',
              transition: 'all 0.2s ease',
            }}>
              <Typography variant="body2" gutterBottom>
                {dragState.draggedItem ? 'Drop here to move to root' : 'No entries yet'}
              </Typography>
              {!dragState.draggedItem && (
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('newEntry')}
                >
                  Create your first entry
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{
              backgroundColor: dragState.draggedOver === 'root' ? 'rgba(144, 202, 249, 0.1)' : 'transparent',
              borderRadius: 1,
              minHeight: '100%',
              position: 'relative',
            }}>
              <SimpleTreeView
                expandedItems={state.currentJournal ? getExpandedItems(state.currentJournal.structure.children) : []}
                onExpandedItemsChange={(_, itemIds) => {
                  // Find which folder was toggled by comparing with current expanded state
                  if (!state.currentJournal) return;
                  const currentExpanded = getExpandedItems(state.currentJournal.structure.children);
                  const newExpanded = itemIds as string[];
                  
                  // Find the difference
                  const added = newExpanded.filter(id => !currentExpanded.includes(id));
                  const removed = currentExpanded.filter(id => !newExpanded.includes(id));
                  
                  // Toggle the changed folder
                  if (added.length > 0) {
                    toggleFolderExpanded(added[0]);
                  } else if (removed.length > 0) {
                    toggleFolderExpanded(removed[0]);
                  }
                }}
              >
                {renderTreeItems(state.currentJournal.structure.children)}
              </SimpleTreeView>
              
              {/* Drop zone for root level */}
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60px',
                backgroundColor: dragState.draggedOver === 'root' && dragState.draggedItem ? 'rgba(144, 202, 249, 0.1)' : 'transparent',
                border: dragState.draggedOver === 'root' && dragState.draggedItem ? '2px dashed rgba(144, 202, 249, 0.5)' : '2px dashed transparent',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                pointerEvents: dragState.draggedItem ? 'auto' : 'none',
              }}>
                {dragState.draggedItem && dragState.draggedOver === 'root' && (
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                    Drop here to move to root level
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Resize Handle */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 4,
            cursor: 'col-resize',
            backgroundColor: isResizing ? 'primary.main' : 'transparent',
            '&:hover': {
              backgroundColor: 'primary.light',
            },
            transition: 'background-color 0.2s',
          }}
          onMouseDown={handleMouseDown}
        />
      </Box>

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
        {contextMenu?.item?.type === 'entry' && (
          <MenuItem onClick={() => handleExport(contextMenu.item as JournalEntry)}>
            <ListItemIcon>
              <ExportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export to Markdown</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleOpenDialog('rename', contextMenu?.item)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        {contextMenu?.item?.type === 'folder' && (
          <>
            <Divider />
            <MenuItem onClick={() => handleOpenDialog('newEntry', null, contextMenu.item?.id)}>
              <ListItemIcon>
                <NewEntryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Add Entry</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleOpenDialog('newFolder', null, contextMenu.item?.id)}>
              <ListItemIcon>
                <NewFolderIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Add Folder</ListItemText>
            </MenuItem>
          </>
        )}
        <Divider />
        <MenuItem onClick={() => handleOpenDialog('delete', contextMenu?.item)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <Dialog 
        open={dialog.type === 'rename' || dialog.type === 'newEntry' || dialog.type === 'newFolder'} 
        onClose={handleCloseDialog}
        fullWidth 
        maxWidth="sm"
        disableRestoreFocus
      >
        <DialogTitle>
          {dialog.type === 'rename' && 'Rename Item'}
          {dialog.type === 'newEntry' && 'New Entry'}
          {dialog.type === 'newFolder' && 'New Folder'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={dialog.type === 'rename' ? 'Name' : (dialog.type === 'newEntry' ? 'Entry Name' : 'Folder Name')}
            fullWidth
            variant="outlined"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleDialogSubmit()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDialogSubmit} variant="contained">
            {dialog.type === 'rename' ? 'Rename' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog.type === 'delete'} onClose={handleCloseDialog}>
        <DialogTitle color="error.main">Confirm Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to delete "{dialog.item?.name}"?
            {dialog.item?.type === 'folder' && ' This will also delete all entries and folders inside it.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
