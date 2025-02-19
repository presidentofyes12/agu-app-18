// src/components/DAODashboard/VotingActivity.tsx

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ethers } from 'ethers';
import { useVotingActivity } from 'hooks/useVotingActivity';
import { ParticipationChart } from 'components/shared/charts/ParticipationChart';
import { VoteCard } from 'components/shared/VoteCard';

// Let's create the VotingActivity component to show real-time voting information
export const VotingActivity: React.FC = () => {
  const { recentVotes, participationStats } = useVotingActivity(); // We'll create this hook next

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Voting Activity</Typography>
      </CardContent>
      <CardContent>
        <div className="space-y-4">
          {/* Participation Chart */}
          <ParticipationChart data={participationStats} />
          
          {/* Recent Votes */}
          <div className="space-y-2">
            {recentVotes.map(vote => (
              <VoteCard
                key={vote.id}
                vote={vote}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
