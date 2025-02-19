import React from 'react';
import { TextField } from '@mui/material';

interface JurisdictionConfigProps {
  value: number;
  onChange: (value: number) => void;
}

export const JurisdictionConfig: React.FC<JurisdictionConfigProps> = ({ value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(event.target.value));
  };

  return (
    <TextField
      label="Jurisdiction Code (8.33-16.67)"
      type="number"
      value={value}
      onChange={handleChange}
      fullWidth
      sx={{ mt: 2 }}
    />
  );
};
