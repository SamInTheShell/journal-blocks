import React, { useEffect, useState, useCallback } from 'react';
import { Box, Alert } from '@mui/material';
import { type PartialBlock } from '@blocknote/core';
import { useBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useJournal } from '../../hooks/useJournal';
import type { JournalEntry, JournalItem } from '../../types/journal';

interface JournalEditorProps {
  entryId: string;
}

function findEntryById(items: JournalItem[], id: string): JournalEntry | null {
  for (const item of items) {
    if (item.id === id && item.type === 'entry') {
      return item;
    }
    if (item.type === 'folder' && item.children) {
      const found = findEntryById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function JournalEditor({ entryId }: JournalEditorProps) {
  const { state, updateEntry } = useJournal();

  // Find the current entry
  const entry = React.useMemo(() => {
    if (state.currentJournal) {
      return findEntryById(state.currentJournal.structure.children, entryId);
    }
    return null;
  }, [state.currentJournal, entryId]);

  // Create stable BlockNote editor with proper initial content
  const editor = useBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: "",
      },
    ],
  });

  // Track loaded entry to prevent re-loading
  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);

  // Load content when entry changes
  useEffect(() => {
    if (entry && editor && entry.id !== loadedEntryId) {
      const entryContent = entry.content;
      
      if (entryContent && Array.isArray(entryContent) && entryContent.length > 0) {
        try {
          // Check if content is actually different before replacing
          const currentBlocks = editor.document;
          const contentChanged = JSON.stringify(currentBlocks) !== JSON.stringify(entryContent);
          
          if (contentChanged) {
            editor.replaceBlocks(currentBlocks, entryContent as PartialBlock[]);
          }
        } catch (error) {
          console.error('Error loading entry content:', error);
          editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
        }
      } else {
        // Entry has no content, reset editor to empty paragraph
        editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
      }
      
      setLoadedEntryId(entry.id);
    }
  }, [entry, editor, loadedEntryId]);

  // Auto-save debouncing
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback((content: PartialBlock[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      updateEntry(entryId, content);
    }, 1000);
  }, [entryId, updateEntry]);

  // Handle content changes with duplicate prevention
  const handleContentChange = useCallback(() => {
    if (editor && entry) {
      const content = editor.document;
      
      // Ensure content is valid before saving
      if (content && Array.isArray(content) && content.length > 0) {
        // Only save if content is actually different from stored content
        const currentSaved = JSON.stringify(entry.content || []);
        const newContent = JSON.stringify(content);
        
        if (currentSaved !== newContent) {
          debouncedSave(content);
        }
      }
    }
  }, [editor, entry, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!entry) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Entry not found. It may have been deleted.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
    }}>
      {/* Editor */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <BlockNoteView
          editor={editor}
          onChange={handleContentChange}
          theme="dark"
          editable={true}
          onContextMenu={(event: React.MouseEvent) => {
            event.preventDefault();
            editor.openSuggestionMenu("/");
          }}
        />
      </Box>
    </Box>
  );
}
