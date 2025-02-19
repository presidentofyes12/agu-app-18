import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { NostrService } from '../../../services/NostrService';
import { ProposalIntegrationService } from './ProposalIntegrationService';
import { Proposal } from 'types/contracts';

interface BatchProposalProcessorProps {
  proposals: Proposal[];
  nostrService: NostrService;
  proposalService: ProposalIntegrationService;
}

export const BatchProposalProcessor: React.FC<BatchProposalProcessorProps> = ({
  proposals,
  nostrService,
  proposalService
}) => {
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'info' | 'warning' | 'error'
  });

  const handleToggleProposal = (proposalId: string) => {
    setSelectedProposals(prev => 
      prev.includes(proposalId)
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    );
  };

  const handleBatchProcess = async () => {
    if (selectedProposals.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one proposal',
        severity: 'warning'
      });
      return;
    }

    setProcessing(true);
    try {
      // Get full proposal data for selected proposals
      const selectedProposalData = proposals.filter(p => 
        selectedProposals.includes(p.id)
      );

      // Batch post to Nostr
      const nostrPosts = await nostrService.batchPostProposals(
        selectedProposalData.map(p => ({
          title: p.title,
          description: p.description,
          category: p.category,
          votingPeriod: p.endEpoch.sub(p.startEpoch).toNumber(),
          chainId: '369', // Pulsechain testnet
          transactionHash: p.id // Using proposal ID as transaction hash for now
        }))
      );

      // Update proposals with Nostr hashes
      for (let i = 0; i < selectedProposalData.length; i++) {
        await proposalService.updateProposalNostrHash(
          selectedProposalData[i].id,
          nostrPosts[i]
        );
      }

      setSnackbar({
        open: true,
        message: `Successfully processed ${selectedProposals.length} proposals`,
        severity: 'success'
      });
      setSelectedProposals([]);

    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error processing proposals: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Batch Proposal Processor
      </Typography>

      <List>
        {proposals.map((proposal) => (
          <ListItem
            key={proposal.id}
            dense
            button
            onClick={() => handleToggleProposal(proposal.id)}
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={selectedProposals.includes(proposal.id)}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText
              primary={proposal.title}
              secondary={`Category: ${proposal.category}`}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleBatchProcess}
          disabled={processing || selectedProposals.length === 0}
          startIcon={processing ? <CircularProgress size={20} /> : null}
        >
          Process Selected Proposals
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};