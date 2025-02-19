// src/views/components/dashboard/ProposalList.tsx
import React, { useEffect, useState } from 'react';
import { 
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  ListProps,
  CircularProgress,
  Box
} from '@mui/material';
import { useProposals } from 'contexts/ProposalContext';
import { useWeb3Manager } from 'hooks/useWeb3Manager';
import { Proposal } from 'types/contracts';
import { ethers, BigNumber } from 'ethers';
import { ProposalIntegrationService } from './ProposalIntegrationService';

import { ProposalState } from '../../../types/contracts';

// Helper to safely convert various number types to BigNumber
const toBigNumber = (value: number | string | BigNumber | undefined): BigNumber => {
  if (!value) return BigNumber.from(0);
  if (BigNumber.isBigNumber(value)) return value;
  try {
    return BigNumber.from(value.toString());
  } catch {
    return BigNumber.from(0);
  }
};

// Helper to safely get a proposal state
/*const getProposalState = (state: any): ProposalState => {
  if (typeof state === 'string' && Object.values(ProposalState).includes(state as ProposalState)) {
    return state as ProposalState;
  }
  return ProposalState.DRAFT;
};*/

const getProposalState = (state: unknown): ProposalState => {
  if (typeof state === 'number') {
    return Object.values(ProposalState)[state] || ProposalState.DRAFT;
  }
  return ProposalState.DRAFT;
};

// Helper function to normalize any proposal-like object to a proper Proposal
const normalizeProposal = (input: any): Proposal => {
  // Ensure we have an object to work with
  const proposal = input || {};
  
  return {
    // Basic string fields
    id: proposal.id?.toString() || '',
    creator: proposal.creator?.toString() || '',
    title: proposal.title?.toString() || '',
    description: proposal.description?.toString() || '',
    category: Number(proposal.category) || 0,
    
    // Optional string fields
    nostrEventId: proposal.nostrEventId?.toString(),
    nostrPubkey: proposal.nostrPubkey?.toString(),
    submissionTx: proposal.submissionTx?.toString(),
    executionTx: proposal.executionTx?.toString(),
    cancelTx: proposal.cancelTx?.toString(),
    
    // Timestamp field
    createdAt: Number(proposal.createdAt) || Math.floor(Date.now() / 1000),
    
    // BigNumber fields with safe conversion
    startEpoch: toBigNumber(proposal.startEpoch),
    endEpoch: toBigNumber(proposal.endEpoch),
    executionDelay: toBigNumber(proposal.executionDelay),
    forVotes: toBigNumber(proposal.forVotes),
    againstVotes: toBigNumber(proposal.againstVotes),
    quorum: toBigNumber(proposal.quorum),
    
    // Enum field with safe conversion
    currentState: getProposalState(proposal.currentState)
  };
};

interface ProposalListProps extends Omit<ListProps, 'children'> {
  proposals?: any[];
  domainWeight?: number;
}

const ProposalList: React.FC<ProposalListProps> = ({ 
  proposals: initialProposals, 
  domainWeight, 
  className, 
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const { activeProposals } = useProposals();
  const { contractService } = useWeb3Manager();

useEffect(() => {
  if (!contractService) {
    console.error("[ProposalList] Contract service not initialized.");
  }

  if (!!contractService) {
    console.error("[ProposalList] Contract service initialized.");
  }
}, []);

  useEffect(() => {
    const loadProposals = async () => {
      if (!contractService) return;

      try {
        setLoading(true);
        const integrationService = new ProposalIntegrationService(contractService);
        const fetchedProposals = await integrationService.getAllProposals();
        
        // Normalize all proposals from different sources
        const allProposals = [
          ...(initialProposals || []).map(normalizeProposal),
          ...fetchedProposals.map(normalizeProposal),
          ...(activeProposals || []).map(normalizeProposal)
        ];

        // Remove duplicates based on proposal ID
        const uniqueProposals = Array.from(
          new Map(allProposals.map(p => [p.id, p])).values()
        );

        setProposals(uniqueProposals);
      } catch (error) {
        console.error('Error loading proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, [contractService, initialProposals, activeProposals]);

  // Component render logic...
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (proposals.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No active proposals
        </Typography>
      </Paper>
    );
  }

  return (
    <List className={className} {...props}>
      {proposals.map(proposal => (
        <ListItem key={proposal.id}>
          <ListItemText
            primary={proposal.title}
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {proposal.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {proposal.id} • Weight: {domainWeight || 1}x • 
                  State: {proposal.currentState}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ProposalList;
