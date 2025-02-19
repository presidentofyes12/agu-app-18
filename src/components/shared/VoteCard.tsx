// src/components/shared/VoteCard.tsx
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { ThumbUp, ThumbDown } from '@mui/icons-material';

interface Vote {
  id: string;
  voter: string;
  support: boolean;
  votes: string;
  timestamp: number;
}

interface VoteCardProps {
  vote: Vote;
}

export const VoteCard: React.FC<VoteCardProps> = ({ vote }) => {
  return (
    <Card sx={{ mb: 1 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            {vote.support ? (
              <ThumbUp color="success" sx={{ mr: 1 }} />
            ) : (
              <ThumbDown color="error" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2">
              {vote.voter.substring(0, 6)}...{vote.voter.substring(38)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {new Date(vote.timestamp * 1000).toLocaleString()}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {parseInt(vote.votes).toLocaleString()} votes
        </Typography>
      </CardContent>
    </Card>
  );
};
