// src/components/shared/MetricItem.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

interface MetricItemProps {
  label: string;
  value: string | number;
  // Adding optional tooltip prop for additional context
  tooltip?: string;
}

export const MetricItem: React.FC<MetricItemProps> = ({ label, value, tooltip }) => {
  // We use Material-UI's Box component for layout and Typography for consistent text styling
  return (
    <Box sx={{ 
      p: 2, 
      borderRadius: 1,
      bgcolor: 'background.paper',
      '&:hover': {
        bgcolor: 'action.hover'
      }
    }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ mt: 1 }}>
        {value}
      </Typography>
    </Box>
  );
};
