import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { NostrService } from '../../../services/NostrService';

interface Member {
  id: string;
  address: string;
  pubkey: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active' | 'inactive';
  joinedAt: number;
}

interface MemberManagementProps {
  teamId: string;
  nostrService: NostrService;
  contractService: any; // Replace with your contract service type
  isAdmin: boolean;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  teamId,
  nostrService,
  contractService,
  isAdmin
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteAddress, setInviteAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'info' | 'warning' | 'error'
  });

  useEffect(() => {
    loadMembers();
  }, [teamId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      // Load members from both blockchain and Nostr
      const onChainMembers = await contractService.getTeamMembers(teamId);
      const nostrMembers = await loadNostrMembers(teamId);

      // Merge and deduplicate members
      const mergedMembers = mergeMemberData(onChainMembers, nostrMembers);
      setMembers(mergedMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      showError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const loadNostrMembers = async (teamId: string): Promise<any[]> => {
    // Implementation will depend on your Nostr service
    return [];
  };

  const mergeMemberData = (onChainMembers: any[], nostrMembers: any[]): Member[] => {
    const memberMap = new Map<string, Member>();

    // Process on-chain members
    onChainMembers.forEach(member => {
      memberMap.set(member.address.toLowerCase(), {
        id: member.address.toLowerCase(),
        address: member.address,
        pubkey: '',
        role: member.role,
        status: 'active',
        joinedAt: member.joinedAt
      });
    });

    // Merge Nostr members
    nostrMembers.forEach(member => {
      const existingMember = memberMap.get(member.address.toLowerCase());
      if (existingMember) {
        memberMap.set(member.address.toLowerCase(), {
          ...existingMember,
          pubkey: member.pubkey
        });
      }
    });

    return Array.from(memberMap.values());
  };

  const handleInviteMember = async () => {
    if (!ethers.utils.isAddress(inviteAddress)) {
      showError('Invalid Ethereum address');
      return;
    }

    setLoading(true);
    try {
      // Create invitation on-chain
      const tx = await contractService.inviteMember(teamId, inviteAddress);
      await tx.wait();

      // Create Nostr invitation event
      await nostrService.createChatMessage(
        `Invitation sent to ${inviteAddress}`,
        teamId
      );

      showSuccess('Invitation sent successfully');
      setInviteDialogOpen(false);
      setInviteAddress('');
      loadMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      showError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setLoading(true);
    try {
      // Remove member on-chain
      const tx = await contractService.removeMember(teamId, memberId);
      await tx.wait();

      // Create Nostr removal event
      await nostrService.createChatMessage(
        `Member ${memberId} removed from team`,
        teamId
      );

      showSuccess('Member removed successfully');
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      showError('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  const showError = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Team Members</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Invite Member
          </Button>
        )}
      </Box>

      <List>
        {members.map((member) => (
          <ListItem key={member.id}>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  {member.address}
                  <Chip
                    size="small"
                    label={member.role}
                    color={member.role === 'admin' ? 'primary' : 'default'}
                  />
                  <Chip
                    size="small"
                    label={member.status}
                    color={
                      member.status === 'active'
                        ? 'success'
                        : member.status === 'pending'
                        ? 'warning'
                        : 'error'
                    }
                  />
                </Box>
              }
              secondary={`Joined: ${new Date(member.joinedAt * 1000).toLocaleDateString()}`}
            />
            {isAdmin && member.role !== 'admin' && (
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="remove"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
      </List>

      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite New Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ethereum Address"
            fullWidth
            variant="outlined"
            value={inviteAddress}
            onChange={(e) => setInviteAddress(e.target.value)}
            error={!!inviteAddress && !ethers.utils.isAddress(inviteAddress)}
            helperText={
              inviteAddress && !ethers.utils.isAddress(inviteAddress)
                ? 'Invalid Ethereum address'
                : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleInviteMember}
            variant="contained"
            disabled={!ethers.utils.isAddress(inviteAddress) || loading}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

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