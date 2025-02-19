import React, { useEffect, useState } from 'react';
import { useProposals } from '../contexts/ProposalContext';
import { useWeb3Manager } from '../hooks/useWeb3Manager';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

const ProposalTest: React.FC = () => {
  const { createProposal, activeProposals, loading, error } = useProposals();
  const { web3State } = useWeb3Manager();
  const [testResult, setTestResult] = useState<string>('');

  const runTest = async () => {
    try {
      setTestResult('Creating test proposal...');
      
      const proposalId = await createProposal(
        'Test Proposal',
        'This is a test proposal to verify the proposal system',
        1, // category
        {
          discussionPeriod: 172800, // 2 days
          votingPeriod: 86400, // 1 day
          executionDelay: 43200 // 12 hours
        }
      );

      setTestResult(`Proposal created with ID: ${proposalId}`);
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (error) {
      setTestResult(`Error: ${error.message}`);
    }
  }, [error]);

  if (!web3State.account) {
    return (
      <Box p={3}>
        <Typography>Please connect your wallet to run the test</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Proposal System Test
      </Typography>

      <Button
        variant="contained"
        onClick={runTest}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Create Test Proposal'}
      </Button>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {testResult}
      </Typography>

      <Typography variant="h6" gutterBottom>
        Active Proposals
      </Typography>

      {activeProposals.map(proposal => (
        <Box key={proposal.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
          <Typography variant="subtitle1">{proposal.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {proposal.description}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            ID: {proposal.id}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ProposalTest;