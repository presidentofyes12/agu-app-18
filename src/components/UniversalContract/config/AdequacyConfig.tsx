import React from 'react';
import { TextField } from '@mui/material';

interface AdequacyConfigProps {
  value: number;
  onChange: (value: number) => void;
}

export const AdequacyConfig: React.FC<AdequacyConfigProps> = ({ value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(event.target.value));
  };

  return (
    <TextField
      label="Adequacy Measure (47.22-48.15)"
      type="number"
      value={value}
      onChange={handleChange}
      fullWidth
      sx={{ mt: 2 }}
    />
  );
};
