// Main App: src/views/components/dashboard/DAOPage.tsx
import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { 
  Card,
  CardHeader,
  CardContent,
  Alert,
  AlertTitle,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Box,
  Stack,
  Chip,
  Button
} from '@mui/material';
import { useNavigate } from '@reach/router';
import { 
  LayoutDashboard,
  Vote,
  Wallet,
  Users,
  Settings
} from 'lucide-react';

import { isConnectedAtom, accountAtom, chainIdAtom } from 'state/web3State';
import { ethers } from 'ethers';

import AppWrapper from 'views/components/app-wrapper';
import AppMenu from 'views/components/app-menu';
import { BigNumber } from 'ethers';

import DAODashboard from './DAODashboard';
import ProposalCreation from './ProposalCreation';
import VotingInterface from './VotingInterface';
import TokenMetrics from './TokenMetrics';
import MembershipStats from './MembershipStats';
import AnonymousTransactions from './AnonymousTransactions';
import ProposalDisplay from './ProposalDisplay';

import DAOProfile from './DAOProfile';
import { ContractService } from './contractService';

function TabPanel(props: {
  children?: React.ReactNode;
  value: string;
  index: string;
}) {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

const DAOErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
    const [error, setError] = useState<Error | null>(null);

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                <AlertTitle>DAO Error</AlertTitle>
                {error.message}
                <Button onClick={() => setError(null)} sx={{ mt: 1 }}>
                    Retry
                </Button>
            </Alert>
        );
    }

    return <>{children}</>;
};

const ConnectionStatus = () => {
  const [isConnected] = useAtom(isConnectedAtom);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor: isConnected ? 'success.main' : 'error.main'
      }} />
      <Typography variant="caption">
        {isConnected ? 'Connected' : 'Disconnected'}
      </Typography>
    </Box>
  );
};

const DAOPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isConnected] = useAtom(isConnectedAtom);
  const [account] = useAtom(accountAtom);
  const [chainId] = useAtom(chainIdAtom);
  const navigate = useNavigate();
  const [contractService, setContractService] = useState<ContractService | null>(null);
  
  const Header = () => (
    <Box sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      p: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Typography variant="h6">DAO Dashboard</Typography>
      {isConnected ? (
        <Stack direction="row" spacing={2}>
          <Chip
            label={`${account?.slice(0, 6)}...${account?.slice(-4)}`}
            color="success"
            sx={{ borderRadius: 1 }}
          />
          <Chip
            label={`Chain ID: ${chainId}`}
            color="primary"
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      ) : (
        <Button 
          variant="contained"
          onClick={() => navigate('/settings/keys')}
        >
          Connect Wallet
        </Button>
      )}
    </Box>
  );

useEffect(() => {
  const initializeContract = async () => {
    if (!window.ethereum || !isConnected) {
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // Request account access first
      
      const contractServiceInstance = new ContractService(
        provider, 
        '0x23767A0C9A072C6A081C27A1C03Cc95B9F9cc6E0'
      );
      
      // Verify contract connection
      const testCall = await contractServiceInstance.contract.provider;
      if (!testCall) {
        throw new Error('Contract connection failed');
      }
      
      setContractService(contractServiceInstance);
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
    }
  };

  initializeContract();
}, [isConnected]); // Add isConnected as dependency

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

useEffect(() => {
  if (!contractService) {
    console.error("[DAOPage] Contract service not initialized.");
  }

  if (!!contractService) {
    console.error("[DAOPage] Contract service initialized.");
  }
}, []);

  return (
      <AppWrapper>
    <AppMenu />
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />

      <Box sx={{ flex: 1, p: 3, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
          <Box sx={{ width: 240, flexShrink: 0 }}>
            <Tabs
              orientation="vertical"
              value={currentTab}
              onChange={handleTabChange}
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  alignItems: 'center',
                  gap: 1
                }
              }}
            >
              <Tab 
                icon={<LayoutDashboard />} 
                label="Overview" 
                value="dashboard"
                iconPosition="start"
              />
              <Tab 
                icon={<Vote />} 
                label="Proposals" 
                value="proposals"
                iconPosition="start"
              />
              <Tab 
                icon={<Wallet />} 
                label="Treasury" 
                value="treasury"
                iconPosition="start"
              />
              <Tab 
                icon={<Users />} 
                label="Members" 
                value="members"
                iconPosition="start"
              />
              <Tab 
                icon={<Settings />} 
                label="Settings" 
                value="settings"
                iconPosition="start"
              />
              <Tab 
                label="Anonymous Transactions" 
                value="anontransact"
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <TabPanel value={currentTab} index="dashboard">
              <DAODashboard />
            </TabPanel>

            <TabPanel value={currentTab} index="proposals">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <ProposalCreation />
                {contractService && <ProposalDisplay contractService={contractService} />}
              </Box>
            </TabPanel>

            <TabPanel value={currentTab} index="treasury">
              <TokenMetrics />
            </TabPanel>

            <TabPanel value={currentTab} index="members">
            <DAOErrorBoundary>
              <MembershipStats />
            </DAOErrorBoundary>
            </TabPanel>
            <TabPanel value={currentTab} index="anontransact">
              <AnonymousTransactions />
            </TabPanel>

            <TabPanel value={currentTab} index="settings">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <DAOProfile />
                
                <Card>
                  <CardContent>
                    <Typography variant="h6">DAO Settings</Typography>
                    <Typography color="textSecondary" sx={{ mt: 1 }}>
                      Configure your DAO preferences and parameters.
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        p: 2,
        mt: 'auto'
      }}>
        <Typography color="textSecondary" variant="body2">
          {chainId === 369 || chainId === 943 ? 
            'Running on PulseChain Network' : 'Connected to Ethereum Network'} • Block: #1234567
        </Typography>
      </Box>
    </Box>
    </AppWrapper>
  );
};

export default DAOPage;
