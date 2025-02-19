import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { ethers } from 'ethers';
import { providerAtom, accountAtom, chainIdAtom, isConnectedAtom } from '../state/web3State';
import { Web3EventAdapter, Web3Events } from '../services/Web3EventAdapter';
import { WEB3_CONFIG } from '../hooks/web3Config';
import '../types/ethereum.d.ts';

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setProvider] = useAtom(providerAtom);
  const [, setAccount] = useAtom(accountAtom);
  const [, setChainId] = useAtom(chainIdAtom);
  const [, setIsConnected] = useAtom(isConnectedAtom);
  const [adapter, setAdapter] = useState<Web3EventAdapter | null>(null);

  useEffect(() => {
    const initProvider = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const web3Adapter = new Web3EventAdapter(window.ethereum);
        setAdapter(web3Adapter);
        setProvider(web3Adapter.getProvider());

        try {
          const accounts = await web3Adapter.requestAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }

          const network = await web3Adapter.getProvider().getNetwork();
          setChainId(network.chainId);
        } catch (error) {
          console.error('Error initializing Web3:', error);
        }

        // Set up event listeners using our typed event system
        web3Adapter.on(Web3Events.AccountsChanged, (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          } else {
            setAccount(null);
            setIsConnected(false);
          }
        });

        web3Adapter.on(Web3Events.ChainChanged, (chainId) => {
          setChainId(parseInt(chainId));
        });
      }
    };

    initProvider();

    return () => {
      if (adapter) {
        adapter.cleanup();
      }
    };
  }, []);

  return <>{children}</>;
};
