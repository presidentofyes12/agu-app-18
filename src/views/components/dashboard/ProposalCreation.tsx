// Main App: src/views/components/dashboard/ProposalCreation.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { Kind } from 'nostr-tools';
import { plateformProposalKey } from '../../../util/constant';
import { ethers, BigNumber } from 'ethers';
import {
  Box,
  FormControl,
  TextField,
  Button,
  Alert,
  AlertTitle,
  Snackbar,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import { isConnectedAtom } from 'state/web3State';
import { ContractService } from './contractService';
import { AuthorityService, VotingCapabilityType, AuthorityStateType, AuthorityStateResponse } from '../../../services/AuthorityService';
import { RavenService } from '../../../services/RavenService';
import { ravenAtom } from 'atoms';
import { RavenEvents } from 'raven/raven';

// Define the structure for proposal data with proper types
interface ProposalData {
  title: string;
  description: string;
  category: number;
  votingPeriod: number;
  isEmergency: boolean;
  postToPulsechain: boolean;
}

// Type definition for snackbar state
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

// Type definition for web3 state
interface Web3State {
  account: string | null;
  isActive: boolean;
  chainId?: number;
}

const ProposalCreation: React.FC = () => {
  // Initialize state with proper typing
  const [contractService, setContractService] = useState<ContractService | null>(null);
  const [raven] = useAtom(ravenAtom);
  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null);
  const [authorityState, setAuthorityState] = useState<AuthorityStateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isConnected] = useAtom(isConnectedAtom);

  // Initialize web3 state with proper interface
  const [web3State, setWeb3State] = useState<Web3State>({
    account: null,
    isActive: false
  });

  // Initialize proposal data with proper interface
  const [proposalData, setProposalData] = useState<ProposalData>({
    title: '',
    description: '',
    category: 0,
    votingPeriod: 7,
    isEmergency: false,
    postToPulsechain: false
  });

  // Initialize snackbar state with proper interface
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Initialize contract with proper error handling and types
  const initializeContract = useCallback(async (): Promise<void> => {
    try {
      if (!window.ethereum) {
        throw new Error('Web3 provider not found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const service = new ContractService(
        provider,
        '0x23767A0C9A072C6A081C27A1C03Cc95B9F9cc6E0', // Contract address
        raven
      );

      setContractService(service);
      
      const epoch = await service.getCurrentEpoch();
      setCurrentEpoch(epoch);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error initializing contract:', error);
      setSnackbar({
        open: true,
        message: `Failed to initialize contract: ${errorMessage}`,
        severity: 'error'
      });
    }
  }, [raven]);

  // Load authority state with proper typing and error handling
  const loadAuthorityState = useCallback(async (): Promise<void> => {
    if (!contractService || !web3State.account) return;

    try {
      const authorityService = AuthorityService.getInstance(contractService);
      const state = await authorityService.getCurrentState(web3State.account);
      setAuthorityState(state);
    } catch (error) {
      console.error('Error loading authority state:', error);
    }
  }, [contractService, web3State.account]);

  useEffect(() => {
    initializeContract();
    loadAuthorityState();

    // Listen for proposal events
    const handleProposalCreated = (proposal: any) => {
      console.log('New proposal created:', proposal);
      // You can update your local state here if needed
    };

    if (raven) {
      raven.addListener(RavenEvents.ChannelCreation, handleProposalCreated);
    }

    return () => {
      if (raven) {
        raven.removeListener(RavenEvents.ChannelCreation, handleProposalCreated);
      }
    };
  }, [web3State.account, raven, initializeContract, loadAuthorityState]);

  // Check if user can create proposals with proper capability checks
  const canCreateProposal = async (): Promise<boolean> => {
    if (!authorityState || !web3State.account || !contractService) return false;

    const authorityService = AuthorityService.getInstance(contractService);
    return await authorityService.hasCapability(
      web3State.account,
      VotingCapabilityType.CREATE_PROPOSAL
    );
  };

  // Handle form submission with proper type safety and error handling
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!contractService) return; // || !await canCreateProposal()

    setLoading(true);
    try {
      // Input validation
      if (!proposalData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!proposalData.description.trim()) {
        throw new Error('Description is required');
      }

      if (proposalData.votingPeriod < 1 || proposalData.votingPeriod > 30) {
        throw new Error('Voting period must be between 1 and 30 days');
      }

      // Check for emergency powers if emergency proposal
      if (proposalData.isEmergency && web3State.account) {
        const authorityService = AuthorityService.getInstance(contractService);
        
        const hasEmergencyPower = await authorityService.hasCapability(
          web3State.account,
          VotingCapabilityType.EMERGENCY_VOTE
        );

        if (!hasEmergencyPower) {
          throw new Error('You do not have emergency proposal rights');
        }
      }

        if (!raven) {
          throw new Error('Raven not initialized');
        }

        // Get the Raven instance here where we know it's initialized
        const raven_ = RavenService.getInstance().getRavenInstance();

        // First, check Nostr connection
        console.log('Raven initialization check:', !!raven);
        const status = await raven.checkConnectionStatus();
        console.log('Nostr connection status:', status);

        // Get current epoch and calculate start/end epochs first
        const currentEpochBN = BigNumber.from(await contractService.getCurrentEpoch());
        const startEpochBN = currentEpochBN.add(1);
        const endEpochBN = startEpochBN.add(BigNumber.from(proposalData.votingPeriod * 24));

        // Get creator and verify
        const creator = raven.getPub;
        console.log('Creating proposal with creator:', creator);

        // Create proposal with proper tags and metadata
        const event = await raven.createProposal({
          id: '', // Will be set by Nostr
          name: proposalData.title,
          about: proposalData.description,
          picture: '',
          creator,
          created: Math.floor(Date.now() / 1000),
          tags: [
            ['p', plateformProposalKey],
            ['kind', Kind.ChannelMetadata.toString()],
            ['category', proposalData.category.toString()]
          ]
        });
        console.log('Nostr event created:', event);
        // Update the proposal with additional metadata
        console.log('Updating proposal with metadata:', {
          id: event.id,
          creator: event.pubkey,
          created: event.created_at,
          currentEpoch: currentEpochBN.toNumber(),
          votingPeriod: proposalData.votingPeriod
        });

        const updateResult = await raven.updateProposal({
          id: event.id,
          creator: event.pubkey,
          created: event.created_at,
          name: proposalData.title,
          about: proposalData.description,
          picture: '',  // Required by Metadata type
          startEpoch: startEpochBN.toString(),
          endEpoch: endEpochBN.toString(),
          category: proposalData.category
        });
        console.log('Proposal update result:', updateResult);
        const nostrEventId = event.id;

        // If posting to Pulsechain, verify we have a valid address first
        if (proposalData.postToPulsechain && !web3State.account) {
            throw new Error('Wallet address not available');
        }

        // Create hash of the proposal data
        const proposalHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['string', 'string', 'uint8', 'uint256', 'uint256', 'address', 'string'],
                [
                    proposalData.title,
                    proposalData.description,
                    proposalData.category,
                    startEpochBN,
                    endEpochBN,
                    web3State.account || '0x0000000000000000000000000000000000000000',  // Use zero address if not posting to Pulsechain
                    nostrEventId
                ]
            )
        );

        // Always publish to Nostr using raven_
        await raven_.createTextNote(
            `New Proposal: ${proposalData.title}\n${proposalData.description}`,
            [
                ['t', 'proposal'],
                ['hash', proposalHash],
                ['category', proposalData.category.toString()],
                ['e', nostrEventId]
            ]
        );

        // If requested, post to Pulsechain
        if (proposalData.postToPulsechain) {
          await contractService.createProposal(
            proposalData.category,
            proposalData.votingPeriod,
            proposalData.title,
            proposalData.description,
            proposalData.postToPulsechain
          );
        }

        const successMessage = proposalData.postToPulsechain
          ? `Proposal created successfully! Nostr ID: ${nostrEventId} and posted to Pulsechain`
          : `Proposal created successfully! Nostr ID: ${nostrEventId}`;

        setSnackbar({
          open: true,
          message: successMessage,
          severity: 'success'
      });

      // Reset form after successful submission
      setProposalData({
        title: '',
        description: '',
        category: 0,
        votingPeriod: 7,
        isEmergency: false,
        postToPulsechain: false
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setSnackbar({
        open: true,
        message: 'Failed to create proposal: ' + errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with proper type safety
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setProposalData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Early return if wallet not connected
  if (!isConnected) {
    return (
      <Alert severity="warning">
        <AlertTitle>Connection Required</AlertTitle>
        Please connect your wallet to create proposals
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 600 }}>
      <FormControl fullWidth>
        <TextField
          name="title"
          label="Proposal Title"
          value={proposalData.title}
          onChange={handleInputChange}
          margin="normal"
          required
          fullWidth
        />
      </FormControl>

      <FormControl fullWidth>
        <TextField
          name="description"
          label="Proposal Description"
          value={proposalData.description}
          onChange={handleInputChange}
          margin="normal"
          required
          fullWidth
          multiline
          rows={4}
        />
      </FormControl>

      <FormControl fullWidth>
        <TextField
          name="category"
          label="Category"
          type="number"
          value={proposalData.category}
          onChange={handleInputChange}
          margin="normal"
          fullWidth
          InputProps={{ inputProps: { min: 0, max: 5 } }}
          helperText="0: General, 1: Technical, 2: Financial, 3: Governance, 4: Community, 5: Emergency"
        />
      </FormControl>

      <FormControl fullWidth>
        <TextField
          name="votingPeriod"
          label="Voting Period (days)"
          type="number"
          value={proposalData.votingPeriod}
          onChange={handleInputChange}
          margin="normal"
          fullWidth
          InputProps={{ inputProps: { min: 1, max: 30 } }}
          helperText="Duration of the voting period (1-30 days)"
        />
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              name="isEmergency"
              checked={proposalData.isEmergency}
              onChange={handleInputChange}
              disabled={!authorityState?.capabilities.includes(VotingCapabilityType.EMERGENCY_VOTE)}
            />
          }
          label={
            authorityState?.capabilities.includes(VotingCapabilityType.EMERGENCY_VOTE)
              ? "Emergency Proposal"
              : "Emergency Proposal (Requires Higher Authority)"
          }
        />

        <FormControlLabel
          control={
            <Switch
              name="postToPulsechain"
              checked={proposalData.postToPulsechain}
              onChange={handleInputChange}
            />
          }
          label="Post to Pulsechain"
        />


      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{ mt: 3, mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Create Proposal'}
      </Button>

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

export default ProposalCreation;