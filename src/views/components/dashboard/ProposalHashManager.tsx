import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ExternalProvider } from '@ethersproject/providers';
import {
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { ContractService } from './contractService';

interface ProposalHash {
  hash: string;
  nostrId: string;
  title: string;
  content: string;
  selected: boolean;
  creator: string;
  created: number;
  name: string;
  about: string;
  picture: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

const ProposalHashManager: React.FC<{ contractService: ContractService }> = ({ contractService }) => {
  const [proposalHashes, setProposalHashes] = useState<ProposalHash[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    loadUnpublishedHashes();
  }, []);

  const loadUnpublishedHashes = async () => {
    try {
      setLoading(true);
      // Get all proposals from Nostr that haven't been published to Pulsechain
      const nostrProposals = await contractService.raven.fetchAllProposal();
      const unpublishedHashes = nostrProposals.map(proposal => ({
        hash: proposal.id, // This should be the actual hash from the proposal metadata
        nostrId: proposal.id,
        title: proposal.content,
        content: proposal.content,
        selected: false,
        creator: proposal.pubkey,
        created: proposal.created_at,
        name: proposal.content,  // Using content as name since it's required
        about: proposal.content, // Using content as about since it's required
        picture: ''  // Required by Metadata type
      }));
      setProposalHashes(unpublishedHashes);
    } catch (error) {
      console.error('Error loading unpublished hashes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load unpublished proposal hashes',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHashSelect = (index: number) => {
    setProposalHashes(prev => prev.map((hash, i) => 
      i === index ? { ...hash, selected: !hash.selected } : hash
    ));
  };

  const handlePublishSelected = async () => {
    const selectedHashes = proposalHashes.filter(h => h.selected);
    if (selectedHashes.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one proposal hash to publish',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      // Get current epoch for timing calculations
      const currentEpoch = await contractService.contracts.stateConstituent.currentEpoch();
      const startEpoch = currentEpoch.add(1);
      const endEpoch = startEpoch.add(40320); // ~1 week at 15s blocks

      if (!window.ethereum) {
        throw new Error('Web3 provider not found');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      // Publish each selected hash
      for (const hash of selectedHashes) {
        const tx = await contractService.contracts.stateConstituent.createProposal(
          hash.title,          // 1st param: title
          hash.content || '',  // 2nd param: description
          0                    // 3rd param: category (using 0 for General)
        );
        await tx.wait();
      }

      setSnackbar({
        open: true,
        message: `Successfully published ${selectedHashes.length} proposal hash(es) to Pulsechain`,
        severity: 'success'
      });

      // Refresh the list
      await loadUnpublishedHashes();
    } catch (error) {
      console.error('Error publishing hashes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to publish proposal hashes',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Unpublished Proposal Hashes
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      ) : proposalHashes.length === 0 ? (
        <Alert severity="info">No unpublished proposal hashes found</Alert>
      ) : (
        <>
          <List>
            {proposalHashes.map((hash, index) => (
              <ListItem key={hash.nostrId} dense button onClick={() => handleHashSelect(index)}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={hash.selected}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={hash.title}
                  secondary={`Hash: ${hash.hash.substring(0, 10)}...`}
                />
              </ListItem>
            ))}
          </List>

          <Button
            variant="contained"
            color="primary"
            onClick={handlePublishSelected}
            disabled={loading || !proposalHashes.some(h => h.selected)}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Publish Selected to Pulsechain'}
          </Button>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProposalHashManager;