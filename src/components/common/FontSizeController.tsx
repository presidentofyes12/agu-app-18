// src/components/common/FontSizeController.tsx
import React, { useEffect } from 'react';
import { atom, useAtom } from 'jotai';
import { Box, Slider, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RefreshIcon from '@mui/icons-material/Refresh';

// Create a persistent atom for font size
export const fontSizeAtom = atom(
  typeof window !== 'undefined' 
    ? Number(localStorage.getItem('preferredFontSize')) || 100 
    : 100
);

interface FontSizeControllerProps {
  hideControls?: boolean;
}

const FontSizeController: React.FC<FontSizeControllerProps> = ({ hideControls = false }) => {
  const [fontSize, setFontSize] = useAtom(fontSizeAtom);

  useEffect(() => {
    // Update root font size and save to localStorage
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem('preferredFontSize', fontSize.toString());
  }, [fontSize]);

  if (hideControls) return null;

  const adjustSize = (amount: number) => {
    setFontSize((prev) => Math.min(Math.max(prev + amount, 50), 200));
  };

  return (
    <Box sx={{ 
      position: 'fixed',
      bottom: (theme) => theme.spacing(2),
      right: (theme) => theme.spacing(2),
      zIndex: (theme) => theme.zIndex.drawer + 1,
      bgcolor: 'background.paper',
      p: 1.5,
      borderRadius: 1,
      boxShadow: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      maxWidth: 300,
    }}>
      <IconButton 
        size="small" 
        onClick={() => adjustSize(-10)}
        sx={{ bgcolor: 'action.hover' }}
      >
        <RemoveIcon />
      </IconButton>

      <Box sx={{ flexGrow: 1, mx: 2 }}>
        <Slider
          value={fontSize}
          onChange={(_, value) => setFontSize(Array.isArray(value) ? value[0] : value)}
          min={50}
          max={200}
          step={5}
          aria-label="Font size"
        />
      </Box>

      <IconButton 
        size="small" 
        onClick={() => adjustSize(10)}
        sx={{ bgcolor: 'action.hover' }}
      >
        <AddIcon />
      </IconButton>

      <Typography variant="body2" sx={{ minWidth: 80 }}>
        {fontSize}%
      </Typography>

      <IconButton 
        size="small" 
        onClick={() => setFontSize(100)}
        sx={{ bgcolor: 'action.hover' }}
      >
        <RefreshIcon />
      </IconButton>
    </Box>
  );
};

export default FontSizeController;
