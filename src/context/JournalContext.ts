import { createContext } from 'react';
import type { JournalBlock, RecentFile, JournalEditorState } from '../types/journal';

interface JournalState {
  currentJournal: JournalBlock | null;
  currentFilePath: string | null;
  recentFiles: RecentFile[];
  editorState: JournalEditorState;
  isLoading: boolean;
  error: string | null;
  saveStatus: 'saved' | 'saving' | 'error' | null;
  lastSaved: string | null;
}

interface JournalContextType {
  state: JournalState;
  openJournal: (filePath?: string | null) => Promise<void>;
  createJournal: () => Promise<void>;
  saveJournal: () => Promise<void>;
  loadRecentFiles: () => Promise<void>;
  openEntry: (entryId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateEntry: (entryId: string, content: unknown) => void;
  setSidebarWidth: (width: number) => void;
  addEntry: (parentId?: string, name?: string) => string;
  addFolder: (parentId?: string, name?: string) => string;
  renameItem: (itemId: string, newName: string) => void;
  deleteItem: (itemId: string) => void;
  moveItem: (itemId: string, newParentId: string, index?: number) => void;
  exportEntry: (entryId: string) => Promise<void>;
  setSelectedFolder: (folderId: string | null) => void;
  toggleFolderExpanded: (folderId: string) => void;
  deleteRecentFile: (filePath: string) => Promise<void>;
  clearRecentFiles: () => Promise<void>;
}

export const JournalContext = createContext<JournalContextType | undefined>(undefined);

export type { JournalState, JournalContextType };
