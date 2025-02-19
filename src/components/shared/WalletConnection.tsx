// src/components/shared/WalletConnection.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import type { ExternalProvider } from '@ethersproject/providers';
import { initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';

// Initialize MetaMask connector
const [metaMask, metaMaskHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions })
);

// This function converts a general provider into a Web3Provider
function getLibrary(provider: ExternalProvider): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

export const WalletConnection: React.FC = () => {
  // Use the hooks directly from the initialized connector
  const { useAccounts, useIsActive, useIsActivating } = metaMaskHooks;
  const accounts = useAccounts();
  const isActive = useIsActive();
  const isActivating = useIsActivating();

  // Track local connection state
  const [error, setError] = useState<Error | null>(null);

  // Handle connection
  const handleConnect = async () => {
    setError(null);
    try {
      await metaMask.activate();
      
      // Check if we're on Pulsechain
      const chainId = await metaMask.provider?.request({ 
        method: 'eth_chainId' 
      });
      
      const pulsechainId = '0x171'; // 369 in hex for Pulsechain mainnet
      
      if (chainId !== pulsechainId) {
        try {
          // Try to switch to Pulsechain
          await metaMask.provider?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: pulsechainId }]
          });
        } catch (switchError: any) {
          // If Pulsechain hasn't been added to MetaMask
          if (switchError.code === 4902) {
            await metaMask.provider?.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: pulsechainId,
                chainName: 'PulseChain',
                nativeCurrency: {
                  name: 'Pulse',
                  symbol: 'PLS',
                  decimals: 18
                },
                rpcUrls: ['https://rpc.pulsechain.com'],
                blockExplorerUrls: ['https://scan.pulsechain.com']
              }]
            });
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      console.error('Failed to connect:', err);
    }
  };

  // Handle disconnection
  const handleDisconnect = async () => {
    try {
      if (metaMask?.deactivate) {
        await metaMask.deactivate();
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  // Try to eagerly connect on component mount
  useEffect(() => {
    void metaMask.connectEagerly();
  }, []);

  // Format account address for display
  const formattedAccount = accounts?.[0] 
    ? `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`
    : '';

  return (
    <Button
      variant="contained"
      onClick={isActive ? handleDisconnect : handleConnect}
      disabled={isActivating}
      color={error ? "error" : "primary"}
    >
      {isActivating ? 'Connecting...' :
       isActive ? formattedAccount : 
       error ? 'Connection Failed' :
       'Connect Wallet'}
    </Button>
  );
};

// Provider component to wrap the application
export const WalletConnectionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <Web3ReactProvider
      connectors={[
        [metaMask, metaMaskHooks]
      ]}
    >
      {children}
    </Web3ReactProvider>
  );
};
