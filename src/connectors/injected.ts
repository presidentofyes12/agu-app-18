// src/connectors/injected.ts
import { InjectedConnector } from '@web3-react/injected-connector';
// We're setting up for Pulsechain. The chainId for Pulsechain mainnet is 369 
// and for testnet is 943
export const injected = new InjectedConnector({
  supportedChainIds: [369, 943] // Add or remove chain IDs as needed
});
