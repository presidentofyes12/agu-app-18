import React from 'react';
import { ethers } from 'ethers';
import { useAtom } from 'jotai';
import { 
  Card, 
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  Button,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { ThumbsUp, ThumbsDown, Timer } from 'lucide-react';
import { Proposal as ContractProposal } from 'types/contracts';
import { ProposalState } from 'types/contracts';

import { isConnectedAtom } from 'state/web3State';
import { PROPOSAL_TYPES } from 'util/constant';

import { ContractService } from './contractService';
import { useAllProposals } from '../../../hooks/useAllProposals';

// Define our component's version of the Proposal interface that matches the contract type
interface Proposal extends Omit<ContractProposal, 'currentState'> {
  currentState: ProposalState;
  forVotes: ethers.BigNumber;
  againstVotes: ethers.BigNumber;
}

interface ProposalDisplayProps {
  contractService: ContractService;
}

const ProposalDisplay: React.FC<ProposalDisplayProps> = ({ contractService }) => {
  const [isConnected] = useAtom(isConnectedAtom);
  const { proposals, loading, error, filterType, setFilterType } = useAllProposals(contractService);

  const calculateVotePercentage = (forVotes: ethers.BigNumber, againstVotes: ethers.BigNumber, isFor: boolean): number => {
    const totalVotes = forVotes.add(againstVotes);
    if (totalVotes.isZero()) return 0;
    
    const relevantVotes = isFor ? forVotes : againstVotes;
    return totalVotes.gt(0) 
      ? Number(relevantVotes.mul(100).div(totalVotes)) 
      : 0;
  };

  const isProposalActive = (state: ProposalState): boolean => {
    return state === ProposalState.ACTIVE;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading proposals: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please connect your wallet to create and vote on proposals
        </Alert>
      )}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Filter Proposals</InputLabel>
          <Select
            value={filterType}
            label="Filter Proposals"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value={PROPOSAL_TYPES.all}>All Proposals</MenuItem>
            <MenuItem value={PROPOSAL_TYPES.active}>Active Proposals</MenuItem>
            <MenuItem value={PROPOSAL_TYPES.expired}>Expired Proposals</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {proposals.map((proposal) => (
        <Card key={proposal.id}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6">
                  {proposal.title}
                  <Typography
                    component="span"
                    variant="subtitle2"
                    sx={{ ml: 1, color: 'text.secondary' }}
                  >
                    #{proposal.id}
                  </Typography>
                </Typography>
              </Box>
            }
            subheader={
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {proposal.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, color: 'text.secondary' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timer className="mr-1 h-4 w-4" />
                    {isProposalActive(proposal.currentState) ? 'Active' : 'Ended'}
                  </Box>
                </Box>
              </Box>
            }
          />

          <CardContent>
            <Box sx={{ mb: 4 }}>
              {/* For Votes */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">For</Typography>
                  <Typography variant="body2">
                    {ethers.utils.formatEther(proposal.forVotes)} votes
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateVotePercentage(proposal.forVotes, proposal.againstVotes, true)}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    backgroundColor: 'error.light',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'success.main'
                    }
                  }}
                />
              </Box>

              {/* Against Votes */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Against</Typography>
                  <Typography variant="body2">
                    {ethers.utils.formatEther(proposal.againstVotes)} votes
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateVotePercentage(proposal.forVotes, proposal.againstVotes, false)}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    backgroundColor: 'success.light',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'error.main'
                    }
                  }}
                />
              </Box>
            </Box>

            {isProposalActive(proposal.currentState) && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<ThumbsDown />}
                    disabled={!isConnected}
                  >
                    Vote Against
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<ThumbsUp />}
                    disabled={!isConnected}
                  >
                    Vote For
                  </Button>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ProposalDisplay;
