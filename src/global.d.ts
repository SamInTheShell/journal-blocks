import type { JournalBlock, RecentFile } from './types/journal';

declare global {
  interface Window {
    electronAPI: {
      openJbFile: () => Promise<string | null>;
      createJbFile: () => Promise<string | null>;
      readJbFile: (filePath: string) => Promise<JournalBlock | null>;
      writeJbFile: (filePath: string, journalData: JournalBlock) => Promise<boolean>;
      getRecentFiles: () => Promise<RecentFile[]>;
            exportToMarkdown: (entryContent: unknown, entryName: string) => Promise<boolean>;
            deleteRecentFile: (filePath: string) => Promise<boolean>;
            clearRecentFiles: () => Promise<boolean>;
    };
  }
}

export { };
