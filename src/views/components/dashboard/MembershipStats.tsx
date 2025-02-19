// Main App: views/components/dashboard/MembershipStats.tsx

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { 
  Card,
  CardHeader,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box
} from '@mui/material';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Vote, Wallet, Share2 } from 'lucide-react';

import { ContractService } from './contractService';

// Type definitions for the component's data structures
interface MemberCategory {
  name: string;
  value: number;
  color: string;
}

interface RecentMember {
  address: string;
  joinDate: number;
  biddingShares: number;
}

// Enhanced type definitions to include connection data
interface Connection {
  target: string;
  trustScore: number;
  isFamilial: boolean;
  isInstitutional: boolean;
}

interface ConnectionResponse {
  target: string;
  trustScore: ethers.BigNumber;
  isFamilial: boolean;
  isInstitutional: boolean;
}

interface MemberConnectionStats {
  totalConnections: number;
  averageTrustScore: number;
  familialConnections: number;
  institutionalConnections: number;
  connectionsList: Connection[];
}

interface MembershipData {
  totalMembers: number;
  activeMembersLast30Days: number;
  averageParticipation: number;
  recentMembers: RecentMember[];
  memberCategories: MemberCategory[];
  connectionStats: MemberConnectionStats;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'] as const;

const initialMembershipData: MembershipData = {
  totalMembers: 0,
  activeMembersLast30Days: 0,
  averageParticipation: 0,
  recentMembers: [],
  memberCategories: [],
  connectionStats: {
    totalConnections: 0,
    averageTrustScore: 0,
    familialConnections: 0,
    institutionalConnections: 0,
    connectionsList: []
  }
};

const MembershipStats: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
const [membershipData, setMembershipData] = useState<MembershipData>(initialMembershipData);

useEffect(() => {
  const fetchMembershipData = async () => {
    try {
      setLoading(true);
      
      // Check for ethereum provider first
      const ethereum = window.ethereum;
      if (!ethereum) {
        throw new Error('No Ethereum provider found');
      }
      
      const provider = new ethers.providers.Web3Provider(ethereum);
      const contractService = new ContractService(
        provider,
        '0x23767A0C9A072C6A081C27A1C03Cc95B9F9cc6E0'
      );

      // Fetch basic membership data
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = currentTimestamp - (30 * 24 * 60 * 60);
      let activeCount = 0;
      const recentMembers: RecentMember[] = [];

      const activeUserCount = await contractService.daoToken.activeUserCount();
      const activeUserCountNumber = activeUserCount.toNumber();

      // Get membership details for each user
      for(let i = 0; i < activeUserCountNumber; i++) {
        const address = await contractService.contract.activeUserIndex(i);
        const memberStatus = await contractService.getMembershipStatus(address);
        
        if(memberStatus.lastActivity > thirtyDaysAgo) {
          activeCount++;
        }

        if(memberStatus.lastActivity > currentTimestamp - (7 * 24 * 60 * 60)) {
          recentMembers.push({
            address,
            joinDate: memberStatus.lastActivity,
            biddingShares: memberStatus.biddingShares
          });
        }
      }

      const participationRate = activeUserCountNumber > 0 
        ? (activeCount / activeUserCountNumber) * 100 
        : 0;

      // Fetch connection data in batches to avoid rate limiting
      const BATCH_SIZE = 10;
      const MAX_BATCHES = 10;
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      let connections: Connection[] = [];
      let totalTrustScore = 0;
      let familialCount = 0;
      let institutionalCount = 0;

      // Fetch connections in smaller batches with delays
      for (let batch = 0; batch < MAX_BATCHES; batch++) {
        const batchStart = batch * BATCH_SIZE;
        
        // Add delay between batches to prevent rate limiting
        if (batch > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const batchPromises = Array.from({ length: BATCH_SIZE }).map(async (_, i) => {
          try {
            const index = batchStart + i;
            return await contractService.contract.connections(userAddress, index);
          } catch {
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validBatchConnections = batchResults.filter((conn): conn is ConnectionResponse => 
          conn !== null && conn.target !== ethers.constants.AddressZero
        );

        // Stop if no valid connections in this batch
        if (validBatchConnections.length === 0) {
          break;
        }

        // Process valid connections
        validBatchConnections.forEach(connection => {
          connections.push({
            target: connection.target,
            trustScore: connection.trustScore.toNumber(),
            isFamilial: connection.isFamilial,
            isInstitutional: connection.isInstitutional
          });
          
          totalTrustScore += connection.trustScore.toNumber();
          if (connection.isFamilial) familialCount++;
          if (connection.isInstitutional) institutionalCount++;
        });
      }

      // Update state with all collected data
      setMembershipData({
        totalMembers: activeUserCountNumber,
        activeMembersLast30Days: activeCount,
        averageParticipation: participationRate,
        recentMembers,
        memberCategories: [
          { 
            name: 'Regular Members', 
            value: activeUserCountNumber - activeCount,
            color: COLORS[0]
          },
          { 
            name: 'Active Members', 
            value: activeCount,
            color: COLORS[1]
          }
        ],
        connectionStats: {
          totalConnections: connections.length,
          averageTrustScore: connections.length > 0 ? totalTrustScore / connections.length : 0,
          familialConnections: familialCount,
          institutionalConnections: institutionalCount,
          connectionsList: connections
        }
      });

      setLoading(false);
    } catch (error: unknown) {
      // First, check if the error is an object with a message property
      if (
        error && 
        typeof error === 'object' && 
        'message' in error && 
        typeof error.message === 'string'
      ) {
        // Now TypeScript knows error.message is a string
        if (error.message.includes('Request limit exceeded')) {
          console.warn('MetaMask request limit reached. Some connection data may be incomplete.');
          setError('Some data may be incomplete due to rate limiting. Please try again in a moment.');
        } else {
          setError(error.message);
        }
      } else {
        // Handle cases where error isn't an Error object
        setError('An unknown error occurred');
      }
      console.error('Error fetching membership data:', error);
      setLoading(false);
    }
  };

  fetchMembershipData();
  const interval = setInterval(fetchMembershipData, 300000);
  return () => clearInterval(interval);
}, []);

const ConnectionStatsCard = () => (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Share2 className="mr-2" size={20} />
        Connection Statistics
      </Box>
    </Typography>
    
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
      gap: 2,
      mb: 4 
    }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total Connections
        </Typography>
        <Typography variant="h6">
          {membershipData.connectionStats.totalConnections}
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Avg Trust Score
        </Typography>
        <Typography variant="h6">
          {membershipData.connectionStats.averageTrustScore.toFixed(1)}
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Familial
        </Typography>
        <Typography variant="h6">
          {membershipData.connectionStats.familialConnections}
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Institutional
        </Typography>
        <Typography variant="h6">
          {membershipData.connectionStats.institutionalConnections}
        </Typography>
      </Paper>
    </Box>

    <Paper sx={{ width: '100%', overflow: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Connected Address</TableCell>
            <TableCell>Trust Score</TableCell>
            <TableCell>Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {membershipData.connectionStats.connectionsList.map((connection, index) => (
            <TableRow key={index}>
              <TableCell>
                {`${connection.target.slice(0, 6)}...${connection.target.slice(-4)}`}
              </TableCell>
              <TableCell>{connection.trustScore}</TableCell>
              <TableCell>
                {connection.isFamilial ? 'Familial' : 
                 connection.isInstitutional ? 'Institutional' : 'Standard'}
              </TableCell>
            </TableRow>
          ))}
          {membershipData.connectionStats.connectionsList.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography color="text.secondary">No connections found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  </Box>
);

  if (loading) {
    return (
      <Card>
        <CardHeader title="Membership Statistics" />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Membership Statistics" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Membership Statistics" />
      <CardContent>
        {/* Overview Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 2,
          mb: 4 
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Users className="mr-2" size={20} />
              <Typography variant="body2" color="text.secondary">
                Total Members
              </Typography>
            </Box>
            <Typography variant="h4">
              {membershipData.totalMembers.toLocaleString()}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Vote className="mr-2" size={20} />
              <Typography variant="body2" color="text.secondary">
                Active (30d)
              </Typography>
            </Box>
            <Typography variant="h4">
              {membershipData.activeMembersLast30Days.toLocaleString()}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Wallet className="mr-2" size={20} />
              <Typography variant="body2" color="text.secondary">
                Participation
              </Typography>
            </Box>
            <Typography variant="h4">
              {membershipData.averageParticipation.toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        {/* Member Categories Pie Chart */}
        <Box sx={{ height: 300, mb: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={membershipData.memberCategories}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {membershipData.memberCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Recent Members Table */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Members</Typography>
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Address</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Bidding Shares</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {membershipData.recentMembers.map((member) => (
                  <TableRow key={member.address}>
                    <TableCell>{member.address}</TableCell>
                    <TableCell>
                      {new Date(member.joinDate * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{member.biddingShares}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      <ConnectionStatsCard />
      </CardContent>
    </Card>
  );
};

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider;
  }
}

export default MembershipStats;
