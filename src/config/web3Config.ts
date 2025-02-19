import { ethers } from 'ethers';

export const CHAIN_ID = process.env.REACT_APP_CHAIN_ID || '1';
export const NETWORK_URL = process.env.REACT_APP_NETWORK_URL || 'http://localhost:8545';

export const STATE_CONTRACT_ADDRESS = process.env.REACT_APP_STATE_CONTRACT_ADDRESS || '0x473b40c989A259eAcED8D8829A1517692aEa8c82';
export const LOGIC_CONTRACT_ADDRESS = process.env.REACT_APP_LOGIC_CONTRACT_ADDRESS || '0x4F10e042C775F5F821339D89d2a5656c7B4C49ba';
export const VIEW_CONTRACT_ADDRESS = process.env.REACT_APP_VIEW_CONTRACT_ADDRESS || '0x658D387603B5758336a13b79276Ddd580642121C';
export const DAO_TOKEN_ADDRESS = process.env.REACT_APP_DAO_TOKEN_ADDRESS || '0x23767A0C9A072C6A081C27A1C03Cc95B9F9cc6E0';

export const getProvider = (): ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider => {
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return new ethers.providers.JsonRpcProvider(NETWORK_URL);
};

export const getSigner = async (): Promise<ethers.Signer> => {
  const provider = getProvider();
  if (provider instanceof ethers.providers.Web3Provider) {
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
  }
  throw new Error('No web3 provider available');
};

export const getContract = async (
  address: string,
  abi: any,
  withSigner = true
): Promise<ethers.Contract> => {
  const provider = getProvider();
  if (withSigner && provider instanceof ethers.providers.Web3Provider) {
    const signer = await getSigner();
    return new ethers.Contract(address, abi, signer);
  }
  return new ethers.Contract(address, abi, provider);
};