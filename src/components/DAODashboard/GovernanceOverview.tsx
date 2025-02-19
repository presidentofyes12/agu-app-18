// src/components/DAODashboard/GovernanceOverview.tsx

import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar 
} from '@mui/material';
import { useProposals } from '../../contexts/ProposalContext';
import {
  HowToVote as VoteIcon,
  Create as CreateIcon,
  CheckCircle as ExecuteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ethers } from 'ethers';

// First, let's define types for our activity feed
interface ActivityItem {
  id: string;
  type: 'vote' | 'create' | 'execute' | 'cancel';
  address: string;
  details: string;
  timestamp: number;
  proposalId?: string;
}

// We'll create a helper to get the right icon for each activity type
const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'vote':
      return <VoteIcon color="primary" />;
    case 'create':
      return <CreateIcon color="secondary" />;
    case 'execute':
      return <ExecuteIcon color="success" />;
    case 'cancel':
      return <CancelIcon color="error" />;
  }
};

// Create a helper to format the activity message
const formatActivityMessage = (activity: ActivityItem): string => {
  switch (activity.type) {
    case 'vote':
      return `Voted on proposal #${activity.proposalId}`;
    case 'create':
      return 'Created new proposal';
    case 'execute':
      return `Executed proposal #${activity.proposalId}`;
    case 'cancel':
      return `Canceled proposal #${activity.proposalId}`;
  }
};

// Now let's implement the ActivityFeed component within GovernanceOverview
const ActivityFeed = () => {
  // In a real implementation, we would get this data from our hooks
  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'create',
      address: '0x1234...5678',
      details: 'Created proposal for treasury allocation',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      proposalId: '45'
    },
    {
      id: '2',
      type: 'vote',
      address: '0x8765...4321',
      details: 'Voted in favor of proposal #44',
      timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
      proposalId: '44'
    },
    {
      id: '3',
      type: 'execute',
      address: '0x9876...5432',
      details: 'Executed proposal #43',
      timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
      proposalId: '43'
    }
  ];

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {recentActivity.map((activity) => (
        <ListItem
          key={activity.id}
          alignItems="flex-start"
          sx={{ 
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:last-child': {
              borderBottom: 'none'
            }
          }}
        >
          <ListItemIcon>
            {getActivityIcon(activity.type)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {formatActivityMessage(activity)}
                <Chip
                  size="small"
                  label={activity.type.toUpperCase()}
                  color={
                    activity.type === 'vote' ? 'primary' :
                    activity.type === 'create' ? 'secondary' :
                    activity.type === 'execute' ? 'success' : 'error'
                  }
                />
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Avatar
                  sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                  alt={activity.address}
                >
                  {activity.address.substring(0, 2)}
                </Avatar>
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                >
                  {activity.address}
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                >
                  • {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

// Create a ProposalCard component
const ProposalCard = ({ proposal, showVoting }: { 
  proposal: any; // We'll type this properly when we have the proposal interface
  showVoting: boolean;
}) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="h6">
        {proposal.title}
      </Typography>
      <Typography color="textSecondary" variant="body2">
        {proposal.description}
      </Typography>
    </CardContent>
  </Card>
);

export const GovernanceOverview: React.FC = () => {
  const { activeProposals } = useProposals();
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Governance Overview</Typography>
      </CardContent>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Proposals */}
            <div>
              <h3 className="text-lg font-medium mb-4">Active Proposals</h3>
              {activeProposals.map(proposal => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  showVoting
                />
              ))}
            </div>
            
            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
