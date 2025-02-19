// Let's put our window augmentation in a separate file to avoid conflicts
// src/connectors/window.d.ts
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
