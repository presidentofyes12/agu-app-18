// src/hooks/useModularDAO.ts
import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { ethers } from 'ethers';
import { Web3EventAdapter } from '../services/Web3EventAdapter';
import {
  providerAtom,
  signerAtom,
  accountAtom,
  chainIdAtom,
  isConnectedAtom,
  balanceAtom,
  familyInfoAtom
} from '../state/web3State';

export function useModularDAO() {
  const [provider, setProvider] = useAtom(providerAtom);
  const [, setSigner] = useAtom(signerAtom);
  const [account, setAccount] = useAtom(accountAtom);
  const [, setChainId] = useAtom(chainIdAtom);
  const [, setIsConnected] = useAtom(isConnectedAtom);
  const [, setBalance] = useAtom(balanceAtom);
  const [familyInfo, setFamilyInfo] = useAtom(familyInfoAtom);

  // Keep an instance of the adapter
  const [adapter, setAdapter] = useState<Web3EventAdapter | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found. Please install MetaMask.');
    }

    try {
      // Create adapter instance if it doesn't exist
      const web3Adapter = adapter || new Web3EventAdapter(window.ethereum);
      if (!adapter) {
        setAdapter(web3Adapter);
      }

      // Use adapter to request accounts
      const accounts = await web3Adapter.requestAccounts();

      if (accounts.length > 0) {
        const newProvider = web3Adapter.getWeb3Provider();
        const newSigner = newProvider.getSigner();
        const chainId = await web3Adapter.requestChainId();

        setProvider(newProvider);
        setSigner(newSigner);
        setAccount(accounts[0]);
        setChainId(parseInt(chainId, 16));
        setIsConnected(true);

        // Fetch initial balance
        const balance = await newProvider.getBalance(accounts[0]);
        setBalance(ethers.utils.formatEther(balance));

        return accounts[0];
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    // Clean up adapter if it exists
    if (adapter) {
      adapter.cleanup();
      setAdapter(null);
    }
    
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setBalance('0');
    setFamilyInfo(null);
  };

  const getProfileInfo = async () => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      // Implement your profile fetching logic here
      // This is a placeholder implementation - adjust according to your needs
      const profileData = {
        // Add your profile data structure here
      };
      return profileData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  return {
    connectWallet,
    disconnectWallet,
    account,
    familyInfo,
    isConnected: !!account,
    provider,
    getProfileInfo // Add this to the returned object
  };
}
