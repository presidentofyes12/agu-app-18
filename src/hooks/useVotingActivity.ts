// src/hooks/useVotingActivity.ts
import React, { useEffect, useState } from 'react';
import { useContractEvents } from 'hooks/useContractEvents';
import { ethers, BigNumber } from 'ethers';

// This interface represents the raw vote data from the blockchain
interface BlockchainVoteEvent {
  id: string;
  voter: string;
  support: boolean;
  votes: BigNumber;
  timestamp: number;
}

// This interface represents how we'll show the vote in the UI
interface VoteEvent {
  id: string;
  voter: string;
  support: boolean;
  votes: string;  // String format for display
  timestamp: number;
}

interface VotingData {
  recentVotes: VoteEvent[];
  participationStats: Array<{
    date: string;
    averageVotes: string;
    totalVotes: string;
    participationCount: number;
  }>;
}

interface VotingHistoryItem {
  votes: BigNumber;
  timestamp: number;
}

export function useVotingActivity() {
  const { stateConstituent } = useContractEvents();
  // Define initial state with proper typing
  const [votingData, setVotingData] = useState<VotingData>({
    recentVotes: [],
    participationStats: []
  });

  const calculateParticipationStats = (history: VotingHistoryItem[]) => {
    if (history.length === 0) return [];
    
    const dailyStats = history.reduce((acc, item) => {
      const date = new Date(item.timestamp * 1000).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: BigNumber.from(0), count: 0 };
      }
      acc[date].total = acc[date].total.add(item.votes);
      acc[date].count++;
      return acc;
    }, {} as Record<string, { total: BigNumber; count: number }>);

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      averageVotes: stats.total.div(stats.count).toString(),
      totalVotes: stats.total.toString(),
      participationCount: stats.count
    }));
  };

  useEffect(() => {
    const fetchVotingActivity = async () => {
      // Add null check for stateConstituent
      if (!stateConstituent) {
        console.warn('State constituent not initialized');
        return;
      }

      try {
        const filter = stateConstituent.filters.VoteCast();
        const events = await stateConstituent.queryFilter(filter, -1000);

        // First, create the blockchain format votes
        const blockchainHistory = await Promise.all(
          events.map(async (event) => {
            const block = await event.getBlock();
            
            if (!event.args) {
              console.warn('Event args undefined for event:', event);
              return null;
            }

            return {
              id: event.transactionHash,
              voter: event.args.voter,
              support: event.args.support,
              votes: event.args.votes,  // Keep as BigNumber
              timestamp: block.timestamp
            };
          })
        );

        // Filter out nulls and cast to correct type
        const validBlockchainHistory = blockchainHistory.filter(
          (item): item is BlockchainVoteEvent => item !== null
        );

        // Create the UI version with string votes
        const uiHistory = validBlockchainHistory.map(vote => ({
          ...vote,
          votes: vote.votes.toString()  // Convert to string for UI
        }));

        // Use blockchain format for calculations, UI format for display
        setVotingData({
          recentVotes: uiHistory.slice(-10),
          participationStats: calculateParticipationStats(validBlockchainHistory)
        });
      } catch (error) {
        console.error('Error fetching voting activity:', error);
      }
    };

    fetchVotingActivity();
    const interval = setInterval(fetchVotingActivity, 15000);
    return () => clearInterval(interval);
  }, [stateConstituent]);

  return votingData;
}
