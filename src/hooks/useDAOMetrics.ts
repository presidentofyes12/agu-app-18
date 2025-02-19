// src/hooks/useDAOMetrics.ts

import React, { useEffect, useState } from 'react';
import { useContractEvents } from 'hooks/useContractEvents';
import { ethers, BigNumber } from 'ethers';

export function useDAOMetrics() {
  const { daoToken, stateConstituent } = useContractEvents();
  const [metrics, setMetrics] = useState({
    totalSupply: ethers.BigNumber.from(0),
    treasuryBalance: ethers.BigNumber.from(0),
    activeMembers: 0,
    votingPower: ethers.BigNumber.from(0),
    proposalCount: 0,
    avgParticipation: 0
  });

interface Proposal {
  totalVotes: BigNumber;
  uniqueVoters: number;
}

  const calculateAverageParticipation = (proposals: Proposal[]): number => {
    if (proposals.length === 0) return 0;
    
    const totalParticipation = proposals.reduce((sum, proposal) => {
      return sum + proposal.uniqueVoters;
    }, 0);
    
    return (totalParticipation / proposals.length) * 100;
  };

  useEffect(() => {
    // First, check if the contracts are available
    if (!daoToken || !stateConstituent) {
      console.warn('Contracts not yet initialized');
      return;
    }

    const fetchMetrics = async () => {
      try {
        // Since we've checked for null contracts above, TypeScript knows they're safe to use here
        const [
          totalSupply,
          treasuryBalance,
          activeMembers,
          votingPower,
          proposalCount
        ] = await Promise.all([
          daoToken.totalSupply(),
          daoToken.treasuryBalance(),
          stateConstituent.getActiveMemberCount(),
          daoToken.getCurrentVotes(),
          stateConstituent.proposalCount()
        ]);

        // Get recent proposals safely
        const recentProposals = await stateConstituent.getRecentProposals(10);
        const avgParticipation = calculateAverageParticipation(recentProposals);

        setMetrics({
          totalSupply,
          treasuryBalance,
          activeMembers,
          votingPower,
          proposalCount,
          avgParticipation
        });
      } catch (error) {
        // Handle any errors that occur during fetching
        console.error('Error fetching metrics:', error);
        // You might want to set some error state here or handle the error differently
      }
    };

    // Start the initial fetch and polling
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);

    // Clean up the interval on unmount
    return () => clearInterval(interval);
  }, [daoToken, stateConstituent]); // Dependencies are properly tracked

  return metrics;
}
