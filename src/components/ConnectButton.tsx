// src/components/ConnectButton.tsx

import React from 'react';
import { Button } from '@mui/material';
import { useWeb3React } from '../hooks/useWeb3ReactProvider';

interface ConnectButtonProps {
  onClick?: () => Promise<void>;
}

export const CustomConnectButton: React.FC<ConnectButtonProps> = ({ onClick }) => {
  const { isActivating, error } = useWeb3React();

  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={isActivating}
      className="px-6 py-2"
    >
      {isActivating ? 'Connecting...' : 'Connect Wallet'}
      {error && <span className="ml-2 text-red-500">Error connecting</span>}
    </Button>
  );
};
