import React, { useReducer, useCallback, useEffect } from 'react';
import type { JournalBlock, RecentFile, JournalItem, TabInfo } from '../types/journal';
import { JournalContext, type JournalState, type JournalContextType } from './JournalContext';

type JournalAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RECENT_FILES'; payload: RecentFile[] }
  | { type: 'SET_CURRENT_JOURNAL'; payload: { journal: JournalBlock; filePath: string } }
  | { type: 'UPDATE_JOURNAL'; payload: JournalBlock }
  | { type: 'ADD_TAB'; payload: TabInfo }
  | { type: 'REMOVE_TAB'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'UPDATE_TAB'; payload: { id: string; changes: Partial<TabInfo> } }
  | { type: 'SET_SIDEBAR_WIDTH'; payload: number }
  | { type: 'SET_SELECTED_FOLDER'; payload: string | null }
  | { type: 'TOGGLE_FOLDER_EXPANDED'; payload: string }
  | { type: 'SET_SAVE_STATUS'; payload: { status: 'saved' | 'saving' | 'error' | null; lastSaved?: string } }
  | { type: 'CLEAR_JOURNAL' };

const initialState: JournalState = {
  currentJournal: null,
  currentFilePath: null,
  recentFiles: [],
  editorState: {
    openTabs: [],
    activeTabId: null,
    sidebarWidth: 300,
    selectedFolderId: null,
  },
  isLoading: false,
  error: null,
  saveStatus: null,
  lastSaved: null,
};

function journalReducer(state: JournalState, action: JournalAction): JournalState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_RECENT_FILES':
      return { ...state, recentFiles: action.payload };
    
    case 'SET_CURRENT_JOURNAL':
      return {
        ...state,
        currentJournal: action.payload.journal,
        currentFilePath: action.payload.filePath,
        editorState: {
          ...state.editorState,
          sidebarWidth: action.payload.journal.settings.sidebarWidth,
        },
      };
    
    case 'UPDATE_JOURNAL':
      return { ...state, currentJournal: action.payload };
    
    case 'ADD_TAB': {
      const existingTab = state.editorState.openTabs.find(tab => tab.entryId === action.payload.entryId);
      if (existingTab) {
        return {
          ...state,
          editorState: {
            ...state.editorState,
            activeTabId: existingTab.id,
          },
        };
      }
      return {
        ...state,
        editorState: {
          ...state.editorState,
          openTabs: [...state.editorState.openTabs, action.payload],
          activeTabId: action.payload.id,
        },
      };
    }
    
    case 'REMOVE_TAB': {
      const newTabs = state.editorState.openTabs.filter(tab => tab.id !== action.payload);
      let newActiveTab = state.editorState.activeTabId;
      if (newActiveTab === action.payload) {
        newActiveTab = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
      }
      return {
        ...state,
        editorState: {
          ...state.editorState,
          openTabs: newTabs,
          activeTabId: newActiveTab,
        },
      };
    }
    
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        editorState: {
          ...state.editorState,
          activeTabId: action.payload,
        },
      };
    
    case 'UPDATE_TAB':
      return {
        ...state,
        editorState: {
          ...state.editorState,
          openTabs: state.editorState.openTabs.map(tab =>
            tab.id === action.payload.id ? { ...tab, ...action.payload.changes } : tab
          ),
        },
      };
    
    case 'SET_SIDEBAR_WIDTH':
      return {
        ...state,
        editorState: {
          ...state.editorState,
          sidebarWidth: action.payload,
        },
      };
    
    case 'SET_SELECTED_FOLDER':
      return {
        ...state,
        editorState: {
          ...state.editorState,
          selectedFolderId: action.payload,
        },
      };
    
    case 'TOGGLE_FOLDER_EXPANDED': {
      if (!state.currentJournal) return state;

      const toggleExpanded = (item: JournalItem): JournalItem => {
        if (item.type === 'folder') {
          if (item.id === action.payload) {
            return { ...item, expanded: !item.expanded };
          }
          return {
            ...item,
            children: item.children.map(toggleExpanded),
          };
        }
        return item;
      };

      const updatedStructure = {
        ...state.currentJournal.structure,
        children: state.currentJournal.structure.children.map(toggleExpanded),
      };

      return {
        ...state,
        currentJournal: {
          ...state.currentJournal,
          structure: updatedStructure,
          modified: new Date().toISOString(),
        },
      };
    }
    
    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: action.payload.status,
        lastSaved: action.payload.lastSaved || state.lastSaved,
      };
    
    case 'CLEAR_JOURNAL':
      return {
        ...initialState,
        recentFiles: state.recentFiles,
      };
    
    default:
      return state;
  }
}



function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function findItemById(items: JournalItem[], id: string): JournalItem | null {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.type === 'folder') {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateItemInTree(items: JournalItem[], itemId: string, updater: (item: JournalItem) => JournalItem): JournalItem[] {
  return items.map(item => {
    if (item.id === itemId) {
      return updater(item);
    }
    if (item.type === 'folder') {
      return {
        ...item,
        children: updateItemInTree(item.children, itemId, updater),
      };
    }
    return item;
  });
}

function removeItemFromTree(items: JournalItem[], itemId: string): JournalItem[] {
  return items.filter(item => {
    if (item.id === itemId) {
      return false;
    }
    if (item.type === 'folder') {
      item.children = removeItemFromTree(item.children, itemId);
    }
    return true;
  });
}

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(journalReducer, initialState);
  
  // Auto-save debouncing
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const saveJournal = useCallback(async () => {
    if (!state.currentJournal || !state.currentFilePath) return;
    
    try {
      // Update sidebar width in journal settings
      const updatedJournal = {
        ...state.currentJournal,
        settings: {
          ...state.currentJournal.settings,
          sidebarWidth: state.editorState.sidebarWidth,
        },
      };
      
      const success = await window.electronAPI.writeJbFile(state.currentFilePath, updatedJournal);
      if (!success) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to save journal' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: null });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save journal' });
    }
  }, [state.currentJournal, state.currentFilePath, state.editorState.sidebarWidth]);
  
  const debouncedSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(saveJournal, 1000);
  }, [saveJournal]);
  
  // Auto-save when journal changes
  useEffect(() => {
    if (state.currentJournal) {
      debouncedSave();
    }
  }, [state.currentJournal, debouncedSave]);

  const loadRecentFiles = useCallback(async () => {
    try {
      const files = await window.electronAPI.getRecentFiles();
      dispatch({ type: 'SET_RECENT_FILES', payload: files });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load recent files' });
    }
  }, []);

  const openJournal = useCallback(async (filePath?: string | null) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const journalPath = filePath || await window.electronAPI.openJbFile();
      if (!journalPath) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const journal = await window.electronAPI.readJbFile(journalPath);
      if (!journal) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load journal file' });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      dispatch({ type: 'SET_CURRENT_JOURNAL', payload: { journal, filePath: journalPath } });
      await loadRecentFiles();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to open journal' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadRecentFiles]);

  const createJournal = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const filePath = await window.electronAPI.createJbFile();
      if (filePath) {
        await openJournal(filePath);
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create journal' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [openJournal]);

  const openEntry = useCallback((entryId: string) => {
    if (!state.currentJournal) return;
    
    const entry = findItemById(state.currentJournal.structure.children, entryId);
    if (!entry || entry.type !== 'entry') return;
    
    const tabId = generateId();
    dispatch({
      type: 'ADD_TAB',
      payload: {
        id: tabId,
        entryId,
        title: entry.name,
        isDirty: false,
      },
    });
  }, [state.currentJournal]);

  const closeTab = useCallback((tabId: string) => {
    dispatch({ type: 'REMOVE_TAB', payload: tabId });
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
  }, []);

  const updateEntry = useCallback((entryId: string, content: unknown) => {
    if (!state.currentJournal) return;
    
    const updatedJournal = {
      ...state.currentJournal,
      structure: {
        ...state.currentJournal.structure,
        children: updateItemInTree(state.currentJournal.structure.children, entryId, (item) => ({
          ...item,
          content,
          modified: new Date().toISOString(),
        })),
      },
    };
    
    dispatch({ type: 'UPDATE_JOURNAL', payload: updatedJournal });
  }, [state.currentJournal]);

  const setSidebarWidth = useCallback((width: number) => {
    dispatch({ type: 'SET_SIDEBAR_WIDTH', payload: width });
  }, []);

  const addEntry = useCallback((parentId?: string, name?: string): string => {
    if (!state.currentJournal) return '';
    
    // Use selected folder if no parentId provided, fallback to root
    const effectiveParentId = parentId || state.editorState.selectedFolderId || 'root';
    const entryName = name || 'New Entry';
    
    const newEntry = {
      id: generateId(),
      type: 'entry' as const,
      name: entryName,
      content: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
    
    const updatedJournal = {
      ...state.currentJournal,
      structure: {
        ...state.currentJournal.structure,
        children: effectiveParentId === 'root' 
          ? [...state.currentJournal.structure.children, newEntry]
          : updateItemInTree(state.currentJournal.structure.children, effectiveParentId, (item) => ({
              ...item,
              children: item.type === 'folder' ? [...item.children, newEntry] : [],
            })),
      },
      modified: new Date().toISOString(),
    };
    
    dispatch({ type: 'UPDATE_JOURNAL', payload: updatedJournal });
    debouncedSave();
    return newEntry.id;
  }, [state.currentJournal, state.editorState.selectedFolderId, debouncedSave]);

    const addFolder = useCallback((parentId?: string, name?: string): string => {
    if (!state.currentJournal) return '';
    
    // Use selected folder if no parentId provided, fallback to root
    const effectiveParentId = parentId || state.editorState.selectedFolderId || 'root';
    const folderName = name || 'New Folder';
    
    const newFolder = {
      id: generateId(),
      type: 'folder' as const,
      name: folderName,
      children: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      expanded: true, // New folders are expanded by default
    };
    
    const updatedJournal = {
      ...state.currentJournal,
      structure: {
        ...state.currentJournal.structure,
        children: effectiveParentId === 'root' 
          ? [...state.currentJournal.structure.children, newFolder]
          : updateItemInTree(state.currentJournal.structure.children, effectiveParentId, (item) => ({
              ...item,
              children: item.type === 'folder' ? [...item.children, newFolder] : [],
            })),
      },
      modified: new Date().toISOString(),
    };
    
    dispatch({ type: 'UPDATE_JOURNAL', payload: updatedJournal });
    debouncedSave();
    return newFolder.id;
  }, [state.currentJournal, state.editorState.selectedFolderId, debouncedSave]);

  const renameItem = useCallback((itemId: string, newName: string) => {
    if (!state.currentJournal) return;
    
    const updatedJournal = {
      ...state.currentJournal,
      structure: {
        ...state.currentJournal.structure,
        children: updateItemInTree(state.currentJournal.structure.children, itemId, (item) => ({
          ...item,
          name: newName,
          ...(item.type === 'entry' ? { modified: new Date().toISOString() } : {}),
        })),
      },
    };
    
    dispatch({ type: 'UPDATE_JOURNAL', payload: updatedJournal });
    
    // Update tab title if this entry is open
    state.editorState.openTabs.forEach(tab => {
      if (tab.entryId === itemId) {
        dispatch({ type: 'UPDATE_TAB', payload: { id: tab.id, changes: { title: newName } } });
      }
    });
  }, [state.currentJournal, state.editorState.openTabs]);

  const deleteItem = useCallback((itemId: string) => {
    if (!state.currentJournal) return;
    
    const updatedJournal = {
      ...state.currentJournal,
      structure: {
        ...state.currentJournal.structure,
        children: removeItemFromTree(state.currentJournal.structure.children, itemId),
      },
    };
    
    dispatch({ type: 'UPDATE_JOURNAL', payload: updatedJournal });
    
    // Close any tabs for this entry or entries in this folder
    const tabsToClose = state.editorState.openTabs.filter(tab => {
      if (!state.currentJournal) return true;
      const entry = findItemById(state.currentJournal.structure.children, tab.entryId);
      return !entry; // Entry no longer exists, so close the tab
    });
    
    tabsToClose.forEach(tab => {
      dispatch({ type: 'REMOVE_TAB', payload: tab.id });
    });
  }, [state.currentJournal, state.editorState.openTabs]);

  const moveItem = useCallback((itemId: string, newParentId: string, index?: number) => {
    if (!state.currentJournal) return;
    
    // Helper function to remove item from tree and return both the item and updated tree
    function extractItem(items: JournalItem[], targetId: string): { item: JournalItem | null; newItems: JournalItem[] } {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === targetId) {
          const item = items[i];
          const newItems = [...items.slice(0, i), ...items.slice(i + 1)];
          return { item, newItems };
        }
        
        if (items[i].type === 'folder') {
          const folderItem = items[i] as { type: 'folder'; children: JournalItem[] };
          const result = extractItem(folderItem.children, targetId);
          if (result.item) {
            const updatedFolder = {
              ...items[i],
              children: result.newItems,
            };
            const newItems = [...items.slice(0, i), updatedFolder, ...items.slice(i + 1)];
            return { item: result.item, newItems };
          }
        }
      }
      return { item: null, newItems: items };
    }
    
    // Helper function to insert item at specific position
    function insertItem(items: JournalItem[], parentId: string, item: JournalItem, position?: number): JournalItem[] {
      if (parentId === 'root') {
        const insertIndex = position !== undefined ? position : items.length;
        return [
          ...items.slice(0, insertIndex),
          item,
          ...items.slice(insertIndex),
        ];
      }
      
      return items.map(currentItem => {
        if (currentItem.id === parentId && currentItem.type === 'folder') {
          const insertIndex = position !== undefined ? position : currentItem.children.length;
          return {
            ...currentItem,
            children: [
              ...currentItem.children.slice(0, insertIndex),
              item,
              ...currentItem.children.slice(insertIndex),
            ],
          };
        }
        
        if (currentItem.type === 'folder') {
          return {
            ...currentItem,
            children: insertItem(currentItem.children, parentId, item, position),
          };
        }
        
        return currentItem;
      });
    }
    
    // Extract the item from its current location
    const { item, newItems } = extractItem(state.currentJournal.structure.children, itemId);
    
    if (!item) return; // Item not found
    
    // Ensure item content is preserved during move by creating a deep copy
    const preservedItem = JSON.parse(JSON.stringify(item));
    
    // Debug logging to track content corruption
    if (item.type === 'entry' && item.content) {
      console.log('Moving entry:', item.name, 'Content before move:', item.content);
    }
    
    // Prevent moving a folder into itself or its descendants
    if (item.type === 'folder' && newParentId !== 'root') {
      function isDescendant(folderId: string, potentialParentId: string): boolean {
        if (folderId === potentialParentId) return true;
        if (!item) return false;
        const folder = findItemById([item], folderId);
        if (folder && folder.type === 'folder') {
          return folder.children.some(child => 
            child.id === potentialParentId || 
            (child.type === 'folder' && isDescendant(child.id, potentialParentId))
          );
        }
        return false;
      }
      
      if (isDescendant(itemId, newParentId)) {
        return; // Invalid move - would create circular reference
      }
    }
    
    // Insert the item in its new location using the preserved item
    const finalItems = insertItem(newItems, newParentId, preservedItem, index);
    
    const updatedJournal = {
      ...state.currentJournal,
      structure: {
        ...state.currentJournal.structure,
        children: finalItems,
      },
    };
    
    dispatch({ type: 'UPDATE_JOURNAL', payload: updatedJournal });
  }, [state.currentJournal]);

    const exportEntry = useCallback(async (entryId: string) => {
    if (!state.currentJournal) return;
    
    const entry = findItemById(state.currentJournal.structure.children, entryId);
    if (!entry || entry.type !== 'entry') return;

    try {
      await window.electronAPI.exportToMarkdown(entry.content, entry.name);
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export entry' });
    }
  }, [state.currentJournal]);

  const setSelectedFolder = useCallback((folderId: string | null) => {
    dispatch({ type: 'SET_SELECTED_FOLDER', payload: folderId });
  }, []);

  const toggleFolderExpanded = useCallback((folderId: string) => {
    dispatch({ type: 'TOGGLE_FOLDER_EXPANDED', payload: folderId });
    debouncedSave(); // Save the expanded state
  }, [debouncedSave]);

  const deleteRecentFile = useCallback(async (filePath: string) => {
    try {
      await window.electronAPI.deleteRecentFile(filePath);
      const files = await window.electronAPI.getRecentFiles();
      dispatch({ type: 'SET_RECENT_FILES', payload: files });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete recent file' });
    }
  }, []);

  const clearRecentFiles = useCallback(async () => {
    try {
      await window.electronAPI.clearRecentFiles();
      dispatch({ type: 'SET_RECENT_FILES', payload: [] });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear recent files' });
    }
  }, []);

  const contextValue: JournalContextType = {
    state,
    openJournal,
    createJournal,
    saveJournal,
    loadRecentFiles,
    openEntry,
    closeTab,
    setActiveTab,
    updateEntry,
    setSidebarWidth,
    addEntry,
    addFolder,
    renameItem,
    deleteItem,
    moveItem,
    exportEntry,
    setSelectedFolder,
    toggleFolderExpanded,
    deleteRecentFile,
    clearRecentFiles,
  };

  return (
    <JournalContext.Provider value={contextValue}>
      {children}
    </JournalContext.Provider>
  );
}


