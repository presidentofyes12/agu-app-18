// src/tests/utils/legalTestUtils.ts

import { ethers } from 'ethers';
import { MockProvider } from 'ethereum-waffle';
import { ContractService } from '../../views/components/dashboard/contractService';

export interface LegalTestContext {
  provider: MockProvider;
  accounts: ethers.Wallet[];
  contractService: ContractService;
  currentState: number;
}

export async function setupLegalTestContext(): Promise<LegalTestContext> {
  const provider = new MockProvider();
  const [owner, ...accounts] = provider.getWallets();
  
  // Create contract service with the proper provider and contract address
  const contractService = new ContractService(
    provider as unknown as ethers.providers.Web3Provider, // Type assertion needed for mock provider
    owner.address
  );
  
  return {
    provider,
    accounts,
    contractService,
    currentState: 0
  };
}

export async function progressToLevel(
  context: LegalTestContext,
  targetLevel: number
): Promise<void> {
  const stateChanges = Math.floor((targetLevel - context.currentState) / 1.85185185);
  
  for (let i = 0; i < stateChanges; i++) {
    await context.contractService.updateState(
      context.accounts[0].address,
      ((i + 1) * 1.85185185).toString() // Convert to string as required by the actual method
    );
  }
}
