import React, { useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';

interface SearchBarProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export default function SearchBar({ onSearchChange, searchQuery }: SearchBarProps) {

  const searchInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Debug: log all key presses to see if events are being captured
      console.log('Key pressed:', { 
        key: event.key, 
        ctrlKey: event.ctrlKey, 
        metaKey: event.metaKey,
        target: event.target
      });
      
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        console.log('Search shortcut detected!');
        event.preventDefault();
        event.stopPropagation();
        
        // Focus the search input
        if (searchInputRef.current) {
          console.log('Focusing search input');
          
          // Force focus with a small delay to ensure DOM is ready
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
              // Select all text if there's any content
              if (searchInputRef.current.value) {
                searchInputRef.current.select();
              }
              // Force the input to be visible and focused
              searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Also try to focus the TextField wrapper
              if (textFieldRef.current) {
                const inputElement = textFieldRef.current.querySelector('input');
                if (inputElement) {
                  inputElement.focus();
                }
              }
            }
          }, 10);
        } else {
          console.log('Search input ref not available');
        }
      }
    };

    // Use window instead of document for more reliable event handling
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    onSearchChange(query);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onSearchChange('');
      searchInputRef.current?.blur();
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search (Ctrl+K)"
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        ref={textFieldRef}
        inputRef={searchInputRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),

        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
        }}
      />
    </Box>
  );
}
