// Core journal types
export interface JournalBlock {
  title: string;
  version: string;
  created: string; // ISO timestamp
  modified: string; // ISO timestamp
  settings: JournalSettings;
  structure: JournalStructure;
}

export interface JournalSettings {
  sidebarWidth: number;
  theme: 'light' | 'dark';
}

export interface JournalStructure {
  id: string;
  type: 'folder';
  name: string;
  children: JournalItem[];
}

// Entry and folder types
export interface JournalEntry {
  id: string;
  type: 'entry';
  name: string;
  content: unknown; // BlockNote content format
  created: string; // ISO timestamp
  modified: string; // ISO timestamp
}

export interface JournalFolder {
  id: string;
  type: 'folder';
  name: string;
  children: JournalItem[];
  created: string; // ISO timestamp
  modified: string; // ISO timestamp
  expanded?: boolean; // Whether the folder is expanded in the UI
}

export type JournalItem = JournalEntry | JournalFolder;

// UI state types
export interface RecentFile {
  path: string;
  title: string;
  lastModified: string;
}

export interface TabInfo {
  id: string;
  entryId: string;
  title: string;
  isDirty: boolean;
}

export interface JournalEditorState {
  openTabs: TabInfo[];
  activeTabId: string | null;
  sidebarWidth: number;
  selectedFolderId: string | null; // Currently selected folder for new item creation
}

// Utility types
export interface TreeOperation {
  type: 'move' | 'create' | 'delete' | 'rename';
  sourceId?: string;
  targetId?: string;
  parentId?: string;
  name?: string;
  itemType?: 'entry' | 'folder';
}
