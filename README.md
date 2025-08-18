# Journal Blocks

A structured note-taking application with hierarchical organization built with Electron, React, and TypeScript.

## Features

- **Hierarchical Organization**: Create folders and entries in a tree structure
- **Rich Text Editing**: Powered by BlockNote editor with formatting tools
- **Auto-save**: All changes are automatically saved as you type
- **Tab Management**: Open multiple entries in tabs with keyboard shortcuts
- **Drag & Drop**: Reorder entries and folders by dragging
- **Export**: Export individual entries to Markdown format
- **Recent Files**: Quick access to recently opened journals

## File Format

Journal Blocks uses `.jb` files (JSON format) to store your journals. Each file contains:
- Journal metadata (title, creation date, settings)
- Hierarchical structure of folders and entries
- Rich text content for each entry

## Keyboard Shortcuts

- `Ctrl/Cmd + Tab` - Next tab
- `Ctrl/Cmd + Shift + Tab` - Previous tab  
- `Cmd + [/]` - Switch tabs (Mac)
- `Ctrl/Cmd + W` - Close tab
- Double-click entry title to rename

## Development

```bash
# Install dependencies
npm install

# Start development server (automatic)
npm run dev

# If concurrently fails, run manually in two terminals:
# Terminal 1:
npm run dev:vite

# Terminal 2:
npm run dev:electron

# Build for production
npm run build

# Lint code
npm run lint
```

## Troubleshooting

**Issue: `Cannot find module '../src/assert'` error with concurrently**

This is a known issue with some versions of concurrently. Use the manual approach:

1. Open two terminal windows in the project directory
2. In terminal 1: `npm run dev:vite` (starts the React dev server on http://localhost:5173)
3. In terminal 2: `npm run dev:electron` (starts Electron and loads the React app)

**Issue: Electron window is blank**

Make sure the Vite dev server is running first before starting Electron. The Electron process expects the React app to be available at http://localhost:5173.

## File Structure

- `main.cjs` - Electron main process
- `public/preload.cjs` - Electron preload script
- `src/` - React application source
  - `components/` - React components
  - `context/` - State management
  - `types/` - TypeScript interfaces
