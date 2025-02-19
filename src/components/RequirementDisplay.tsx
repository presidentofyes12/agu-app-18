// components/RequirementDisplay.tsx

import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { TransitionRequirement } from '../types/transition';

interface RequirementDisplayProps {
  requirement: TransitionRequirement;
  currentValue: number;
}

export const RequirementDisplay: React.FC<RequirementDisplayProps> = ({
  requirement,
  currentValue
}) => {
  const progress = Math.min((currentValue / requirement.threshold) * 100, 100);

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">
          {requirement.type}
        </Typography>
        <Typography variant="body2">
          {currentValue.toFixed(2)} / {requirement.threshold.toFixed(2)}
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progress}
        sx={{
          height: 8,
          borderRadius: 1
        }}
      />
      {requirement.description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {requirement.description}
        </Typography>
      )}
    </Box>
  );
};
