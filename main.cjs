
// ...existing code...
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');

app.setName('Journal Blocks');

const template = [
  {
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'File',
    submenu: [
      { role: 'close' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

function createWindow() {
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'public', 'preload.cjs'),
        },
    });
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173');
        // win.webContents.openDevTools(); // Open DevTools
        win.webContents.reloadIgnoringCache(); // Force reload
    } else {
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
}

app.whenReady().then(() => {
    
    // Recent files storage
    const recentFilesPath = path.join(os.homedir(), '.journal-blocks-recent.json');
    
    async function getRecentFiles() {
        try {
            const data = await fs.readFile(recentFilesPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }
    
    async function updateRecentFiles(filePath, title) {
        try {
            const recent = await getRecentFiles();
            const existing = recent.findIndex(f => f.path === filePath);
            const newFile = {
                path: filePath,
                title: title,
                lastModified: new Date().toISOString()
            };
            
            if (existing >= 0) {
                recent[existing] = newFile;
            } else {
                recent.unshift(newFile);
            }
            
            // Keep only last 10 files
            const trimmed = recent.slice(0, 10);
            await fs.writeFile(recentFilesPath, JSON.stringify(trimmed, null, 2));
            return trimmed;
        } catch (error) {
            console.error('Failed to update recent files:', error);
            return [];
        }
    }
    
    // Journal Block file operations
    ipcMain.handle('open-jb-file', async (event) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Journal Block Files', extensions: ['jb'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (canceled || filePaths.length === 0) {
            return null;
        }
        
        return filePaths[0];
    });
    
    ipcMain.handle('create-jb-file', async (event) => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            defaultPath: 'My Journal.jb',
            filters: [
                { name: 'Journal Block Files', extensions: ['jb'] }
            ]
        });
        
        if (canceled || !filePath) {
            return null;
        }
        
        const template = {
            title: path.basename(filePath, '.jb'),
            version: '1.0',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            settings: {
                sidebarWidth: 300,
                theme: 'light'
            },
            structure: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: []
            }
        };
        
        try {
            await fs.writeFile(filePath, JSON.stringify(template, null, 2));
            await updateRecentFiles(filePath, template.title);
            return filePath;
        } catch (error) {
            console.error('Failed to create journal file:', error);
            return null;
        }
    });
    
    ipcMain.handle('read-jb-file', async (event, filePath) => {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const journal = JSON.parse(content);
            await updateRecentFiles(filePath, journal.title);
            return journal;
        } catch (error) {
            console.error('Failed to read journal file:', error);
            return null;
        }
    });
    
    ipcMain.handle('write-jb-file', async (event, filePath, journalData) => {
        try {
            journalData.modified = new Date().toISOString();
            await fs.writeFile(filePath, JSON.stringify(journalData, null, 2));
            await updateRecentFiles(filePath, journalData.title);
            return true;
        } catch (error) {
            console.error('Failed to write journal file:', error);
            return false;
        }
    });
    
    ipcMain.handle('get-recent-files', async (event) => {
        return await getRecentFiles();
    });

    ipcMain.handle('delete-recent-file', async (event, filePath) => {
        try {
            const recent = await getRecentFiles();
            const filtered = recent.filter(file => file.path !== filePath);
            await fs.writeFile(recentFilesPath, JSON.stringify(filtered, null, 2));
            return true;
        } catch (error) {
            console.error('Failed to delete recent file:', error);
            return false;
        }
    });

    ipcMain.handle('clear-recent-files', async (event) => {
        try {
            await fs.writeFile(recentFilesPath, JSON.stringify([], null, 2));
            return true;
        } catch (error) {
            console.error('Failed to clear recent files:', error);
            return false;
        }
    });
    
    ipcMain.handle('export-to-markdown', async (event, entryContent, entryName) => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            defaultPath: `${entryName}.md`,
            filters: [
                { name: 'Markdown Files', extensions: ['md'] }
            ]
        });
        
        if (canceled || !filePath) {
            return false;
        }
        
        try {
            // Convert BlockNote content to markdown (simplified conversion)
            let markdown = `# ${entryName}\n\n`;
            if (typeof entryContent === 'string') {
                markdown += entryContent;
            } else if (Array.isArray(entryContent)) {
                // Handle BlockNote block format
                entryContent.forEach(block => {
                    if (block.type === 'paragraph' && block.content) {
                        const text = block.content.map(item => item.text || '').join('');
                        markdown += text + '\n\n';
                    } else if (block.type === 'heading' && block.content) {
                        const level = block.props?.level || 1;
                        const text = block.content.map(item => item.text || '').join('');
                        markdown += '#'.repeat(level) + ' ' + text + '\n\n';
                    }
                });
            }
            
            await fs.writeFile(filePath, markdown);
            return true;
        } catch (error) {
            console.error('Failed to export to markdown:', error);
            return false;
        }
    });



    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

// In development, force non-zero exit after app quits to kill concurrently
if (process.env.NODE_ENV === 'development') {
    app.on('quit', () => {
        process.exit(1);
    });
}

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
