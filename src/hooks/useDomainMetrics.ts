// hooks/useDomainMetrics.ts
import { useState, useEffect, useCallback } from 'react';
import { useWeb3Manager } from './useWeb3Manager';

export const useDomainMetrics = () => {
  const [metrics, setMetrics] = useState<DomainMetrics>();
  const [capabilities, setCapabilities] = useState<DomainCapabilities>();
  const { contractService } = useWeb3Manager();

  useEffect(() => {
    const loadMetrics = async () => {
      // Early return if contractService is not available
      if (!contractService?.stateContract) {
        console.log('Waiting for contract service initialization...');
        return;
      }

      try {
        const stateData = await contractService.stateContract.getProposalState(
          contractService.stateContract.address,
          0
        );

        // Get token metrics
        const tokenMetrics = await contractService.getTokenMetrics();

        const currentLevel = stateData.stage >= 3 ? 
          16.67 + (stateData.stage - 3) * 1.85185185 : 
          16.67;

        setMetrics({
          currentLevel,
          proposalCount: stateData.totalProposals,
          activeUserCount: await contractService.stateContract.activeUserCount(),
          currentStage: stateData.stage,
          reputationScores: {}, // Fetch for relevant addresses
          //treasuryBalance: tokenMetrics.treasuryBalance,
          treasuryBalance: BigInt(tokenMetrics.treasuryBalance),
          lastEpochUpdate: stateData.lastUpdate,
          governanceWeight: Math.floor((currentLevel - 16.67) * 10) / 10 + 1
        });

        // Calculate available capabilities based on level
        setCapabilities({
          daoStructure: currentLevel >= 17.59259259,
          complexGovernance: currentLevel >= 20.37037037,
          sovereignAuthority: currentLevel >= 23.14814815
        });
      } catch (error) {
        console.error('Failed to load domain metrics:', error);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [contractService]);

  return { metrics, capabilities };
};
