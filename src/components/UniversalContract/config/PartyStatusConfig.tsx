import React from 'react';
import { Box, TextField } from '@mui/material';
import { PartyConfiguration } from '../LegalFrameworkBuilder';

interface PartyStatusConfigProps {
  config: PartyConfiguration;
  onChange: (config: PartyConfiguration) => void;
}

export const PartyStatusConfig: React.FC<PartyStatusConfigProps> = ({ config, onChange }) => {
  const handleChange = (field: keyof PartyConfiguration) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...config,
      [field]: parseFloat(event.target.value)
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <TextField
        label="Individual Status (2.77-3.70)"
        type="number"
        value={config.individualStatus}
        onChange={handleChange('individualStatus')}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Entity Status (3.70-4.63)"
        type="number"
        value={config.entityStatus}
        onChange={handleChange('entityStatus')}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Collective Status (4.63-5.55)"
        type="number"
        value={config.collectiveStatus}
        onChange={handleChange('collectiveStatus')}
        fullWidth
      />
    </Box>
  );
};
