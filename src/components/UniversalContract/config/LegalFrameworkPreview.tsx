import React from 'react';
import { Box, Typography } from '@mui/material';
import { LegalConfiguration } from '../LegalFrameworkBuilder';

interface LegalFrameworkPreviewProps {
  config: LegalConfiguration;
}

export const LegalFrameworkPreview: React.FC<LegalFrameworkPreviewProps> = ({ config }) => {
  return (
    <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>Configuration Preview</Typography>
      <pre style={{ overflow: 'auto' }}>
        {JSON.stringify(config, null, 2)}
      </pre>
    </Box>
  );
};
