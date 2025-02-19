import { ethers, BigNumber } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

export const getProvider = (): Web3Provider | ethers.providers.JsonRpcProvider => {
  if (window.ethereum) {
    return new Web3Provider(window.ethereum);
  }
  return new ethers.providers.JsonRpcProvider('http://localhost:8545');
};

export const getSigner = async () => {
  const provider = getProvider();
  if (provider instanceof Web3Provider) {
    await provider.send('eth_requestAccounts', []);
    return provider.getSigner();
  }
  throw new Error('No web3 provider available');
};

export const toBigNumber = (value: string | number | BigNumber): BigNumber => {
  if (BigNumber.isBigNumber(value)) return value;
  try {
    return BigNumber.from(value.toString());
  } catch {
    return BigNumber.from(0);
  }
};

export const formatUnits = (value: BigNumber | string | number, decimals = 18): string => {
  return ethers.utils.formatUnits(toBigNumber(value), decimals);
};

export const parseUnits = (value: string, decimals = 18): BigNumber => {
  try {
    return ethers.utils.parseUnits(value, decimals);
  } catch {
    return BigNumber.from(0);
  }
};