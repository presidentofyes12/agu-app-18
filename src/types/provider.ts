// src/types/provider.ts
import { ethers } from 'ethers';

export type Web3Provider = ethers.providers.Web3Provider;
export type JsonRpcProvider = ethers.providers.JsonRpcProvider;
export type Provider = Web3Provider | JsonRpcProvider;
