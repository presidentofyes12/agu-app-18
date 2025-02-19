// Main App: src/views/components/dashboard/VotingInterface.tsx
import React, { useState, useEffect } from 'react';
import { ContractService } from './contractService';
import { toBigNumber, formatUnits, parseUnits, getProvider } from 'utils/web3';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3Manager } from 'hooks/useWeb3Manager';
import { AuthorityService, VotingCapabilityType, AuthorityStateResponse } from 'services/AuthorityService';
//import { ProposalState as ProposalLifecycleState } from 'services/ProposalLifecycle';
import { ProposalIntegrationService } from './ProposalIntegrationService';
//import { DAOProposal } from './ProposalTypes';
//import { ProposalState as ContractProposalState } from 'types/contracts';
import { ProposalState, ProposalStateData } from 'types/contracts';

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  TextField,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';

import { Loader2, ThumbsUp, ThumbsDown, Timer, Users, Shield } from 'lucide-react';

// Extend the original proposal interface to support dual voting
interface VotingInterfaceProps {
  proposal: {
    id: string;
    title: string;
    description: string;
    proposer?: string;
    startTime?: number;
    endTime?: number;
    forVotes?: string;
    againstVotes?: string;
    executed?: boolean;
    category?: number;
    isPermanent?: boolean;
  };
}

// Enum for proposal states
/*const ProposalState = {
  Pending: 0,
  Active: 1,
  Canceled: 2,
  Defeated: 3,
  Succeeded: 4,
  Executed: 5
} as const;*/

type ProposalStateType = typeof ProposalState[keyof typeof ProposalState];

const formatCapability = (key: string): string => {
  switch (key) {
    case 'daoStructure': return 'DAO Structure';
    case 'complexGovernance': return 'Complex Governance';
    case 'sovereignAuthority': return 'Sovereign Authority';
    default: return key;
  }
};

const VotingInterface: React.FC<VotingInterfaceProps> = ({ proposal }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [proposalState, setProposalState] = useState<ProposalStateData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [voteAmount, setVoteAmount] = useState<string>('');
  const [voteForDialogOpen, setVoteForDialogOpen] = useState<boolean>(false);
  const [voteAgainstDialogOpen, setVoteAgainstDialogOpen] = useState<boolean>(false);
  const [contractService, setContractService] = useState<ContractService | null>(null);
  const [authorityState, setAuthorityState] = useState<AuthorityStateResponse | null>(null);
  const { web3State } = useWeb3Manager();
  
useEffect(() => {
  if (!contractService) {
    console.error("[VotingInterface] Contract service not initialized.");
  }

  if (!!contractService) {
    console.error("[VotingInterface] Contract service initialized.");
  }
}, []);
  
  //const integrationService = new ProposalIntegrationService(contractService);

  // Initialize contract and integration services
  useEffect(() => {
    const initializeContract = async (): Promise<void> => {
      try {
        if (!window.ethereum) {
          throw new Error('Web3 provider not found');
        }
        
        const provider = getProvider();
        if (!('getSigner' in provider)) {
          throw new Error('Provider does not support signing');
        }
        await provider.send("eth_requestAccounts", []);
        
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        console.log('Connected with address:', address);
        
        const service = new ContractService(
          provider as Web3Provider,
          '0x23767A0C9A072C6A081C27A1C03Cc95B9F9cc6E0'
        );
        
        const testCall = await service.contract.provider;
        if (!testCall) {
          throw new Error('Contract connection failed');
        }
        
        setContractService(service);
        
        // Enhanced state fetching to include channel votes
        if (proposal.id) {
          //const onChainState = await service.getProposalState(parseInt(proposal.id));
          
          // When setting proposal state, transform the response properly
        const response = await service.getProposalState(proposal.id);
        setProposalState(response);
          
          // Get channel votes if available
          let channelVotes;
          if (service.raven) {
            const messages = await service.raven.getChannelMessages(proposal.id);
            channelVotes = {
              forVotes: messages.filter(m => m.content === 'VOTE_FOR').length,
              againstVotes: messages.filter(m => m.content === 'VOTE_AGAINST').length
            };
          }

          setProposalState({
            ...response,
            ravenVotes: channelVotes
          });
        }
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };

    initializeContract();
  }, [proposal.id]);

  // Preserve existing time remaining logic
  useEffect(() => {
    const updateTimeRemaining = (): void => {
      if (!proposalState) return;

      const now = Math.floor(Date.now() / 1000);
      const end = proposalState.endEpoch;
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Voting ended');
        return;
      }

      const days = Math.floor(diff / (24 * 60 * 60));
      const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((diff % (60 * 60)) / 60);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m remaining`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [proposalState]);

  // Preserve authority state loading
  useEffect(() => {
    const loadAuthorityState = async (): Promise<void> => {
      if (!contractService || !web3State.account) return;
      
      try {
        const authorityService = AuthorityService.getInstance(contractService);
        const state = await authorityService.getCurrentState(web3State.account);
        setAuthorityState(state);
      } catch (error) {
        console.error('Error loading authority state:', error);
      }
    };

    loadAuthorityState();
  }, [contractService, web3State.account]);
  
  const closeVoteDialogs = (): void => {
    setVoteForDialogOpen(false);
    setVoteAgainstDialogOpen(false);
    setVoteAmount('');
  };

  // Enhanced vote handling
  const handleVote = async (support: boolean): Promise<void> => {
    if (!contractService || !voteAmount || !authorityState || !web3State.account) return;
    
    setLoading(true);
    try {
      const authorityService = AuthorityService.getInstance(contractService);
      const baseAmount = parseUnits(voteAmount, 18);
      
      // Calculate weighted voting power
      // Use BigNumber consistently for vote amounts
      // Get voting power from authority service
      await authorityService.getVotingPower(
        web3State.account,
        BigInt(baseAmount.toString())
      );

      // Handle veto votes
      if (!support && await authorityService.hasCapability(
        web3State.account,
        VotingCapabilityType.VETO_VOTE
      )) {
        await handleVetoVote();
        return;
      }

      // Use integration service for voting
      const integrationService = new ProposalIntegrationService(contractService);
      await integrationService.castVote(
        proposal.id,
        support
      );
      
      // Update both on-chain and channel state
      const newState = await contractService.getProposalState(proposal.id);
      let channelVotes = proposalState?.ravenVotes;
      
      if (contractService.raven) {
        const messages = await contractService.raven.getChannelMessages(proposal.id);
        channelVotes = {
          forVotes: messages.filter(m => m.content === 'VOTE_FOR').length,
          againstVotes: messages.filter(m => m.content === 'VOTE_AGAINST').length
        };
      }

      setProposalState({
        ...newState,
        ravenVotes: channelVotes
      });
      
      closeVoteDialogs();
    } catch (error) {
      console.error('Error casting vote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVetoVote = async (): Promise<void> => {
    if (!contractService) return;
    
    try {
      const integrationService = new ProposalIntegrationService(contractService);
      await integrationService.castVote(proposal.id, false);
    } catch (error) {
      console.error('Error casting veto vote:', error);
      throw error;
    }
  };

  const hasCapability = (capability: VotingCapabilityType): boolean => {
    return authorityState?.capabilities.includes(capability) || false;
  };

  // Add authority-specific UI elements
  const renderAuthorityIndicators = (): React.ReactNode => {
    if (!authorityState) return null;

    return (
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        {Object.values(VotingCapabilityType).map((capability) => (
          <Chip
            key={capability}
            label={formatCapability(capability)}
            color={hasCapability(capability) ? 'primary' : 'default'}
            size="small"
          />
        ))}
      </Box>
    );
  };

  if (!proposalState) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const totalVotes = proposalState.forVotes.add(proposalState.againstVotes);
  const forPercentage = totalVotes.gt(0)
    ? proposalState.forVotes.mul(100).div(totalVotes).toNumber()
    : 0;
  const againstPercentage = 100 - forPercentage;

  const isVotingActive = proposalState.state === ProposalState.ACTIVE;

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {proposal.title}
              <Typography component="span" variant="subtitle2" sx={{ ml: 1, color: 'text.secondary' }}>
                #{proposal.id}
              </Typography>
            </Typography>
            {proposal.isPermanent && (
              <Chip
                icon={<Shield size={16} />}
                label="Permanent Proposal"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        }
        subheader={
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {proposal.description}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mt: 1,
              color: 'text.secondary'
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 1 }}>
                <Timer size={16} />
              </Box>
              {timeRemaining}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 1 }}>
                <Users size={16} />
              </Box>
              {totalVotes.toString()} votes
            </Box>
            </Box>
          </Box>
        }
        action={renderAuthorityIndicators()}
      />

      <CardContent>
        {/* Voting Progress */}
        <Box sx={{ mb: 4 }}>
          {/* For Votes */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">For</Typography>
              <Typography variant="body2">{forPercentage}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={forPercentage}
              sx={{
                height: 8,
                backgroundColor: 'error.light',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'success.main'
                }
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {formatUnits(proposalState.forVotes, 18)} votes
            </Typography>
          </Box>

          {/* Against Votes */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Against</Typography>
              <Typography variant="body2">{againstPercentage}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={againstPercentage}
              sx={{
                height: 8,
                backgroundColor: 'success.light',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'error.main'
                }
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {formatUnits(proposalState.againstVotes, 18)} votes
            </Typography>
          </Box>
        </Box>

        {/* Voting Actions */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 2 
        }}>
          {isVotingActive && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setVoteAgainstDialogOpen(true)}
                disabled={loading}
                startIcon={<ThumbsDown />}
                sx={{ flex: 1, mr: 1 }}
              >
                Vote Against
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => setVoteForDialogOpen(true)}
                disabled={loading}
                startIcon={<ThumbsUp />}
                sx={{ flex: 1, ml: 1 }}
              >
                Vote For
              </Button>
            </>
          )}
        </Box>

        {/* Vote For Dialog */}
        <Dialog 
          open={voteForDialogOpen} 
          onClose={() => setVoteForDialogOpen(false)}
        >
          <DialogTitle>Cast Vote For Proposal</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Enter the amount of tokens you want to vote with:
            </DialogContentText>
            <TextField
              label="Vote Amount"
              type="number"
              value={voteAmount}
              onChange={(e) => setVoteAmount(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <DialogContentText color="warning.main">
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVoteForDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => handleVote(true)}
              variant="contained"
              color="success"
              disabled={loading || !voteAmount}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Confirm Vote'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Vote Against Dialog */}
        <Dialog 
          open={voteAgainstDialogOpen} 
          onClose={() => setVoteAgainstDialogOpen(false)}
        >
          <DialogTitle>Cast Vote Against Proposal</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Enter the amount of tokens you want to vote with:
            </DialogContentText>
            <TextField
              label="Vote Amount"
              type="number"
              value={voteAmount}
              onChange={(e) => setVoteAmount(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <DialogContentText color="warning.main">
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVoteAgainstDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => handleVote(false)}
              variant="contained"
              color="error"
              disabled={loading || !voteAmount}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Confirm Vote'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default VotingInterface;
