import React from 'react';
import { TextField } from '@mui/material';

interface ConsiderationConfigProps {
  value: number;
  onChange: (value: number) => void;
}

export const ConsiderationConfig: React.FC<ConsiderationConfigProps> = ({ value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(event.target.value));
  };

  return (
    <TextField
      label="Consideration Value (41.67-42.59)"
      type="number"
      value={value}
      onChange={handleChange}
      fullWidth
      sx={{ mt: 2 }}
    />
  );
};
