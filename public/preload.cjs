const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Journal Block file operations
  openJbFile: () => ipcRenderer.invoke('open-jb-file'),
  createJbFile: () => ipcRenderer.invoke('create-jb-file'),
  readJbFile: (filePath) => ipcRenderer.invoke('read-jb-file', filePath),
  writeJbFile: (filePath, journalData) => ipcRenderer.invoke('write-jb-file', filePath, journalData),
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  exportToMarkdown: (entryContent, entryName) => ipcRenderer.invoke('export-to-markdown', entryContent, entryName),
  deleteRecentFile: (filePath) => ipcRenderer.invoke('delete-recent-file', filePath),
  clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),
});
