// Main App: src/views/components/dashboard/DAOGovernance.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Tabs,
  Tab,
  Button,
  Alert,
  AlertTitle,
  Grid
} from '@mui/material';
import { 
  Settings, 
  Vote, 
  Wallet, 
  Shield, 
  AlertTriangle 
} from 'lucide-react';
import { useWeb3Manager } from 'hooks/useWeb3Manager';

interface GovernanceProps {
  domainLevel: number;
  governanceWeight: number;
  stage: number;
}

const DAOGovernance: React.FC<GovernanceProps> = ({
  domainLevel,
  governanceWeight,
  stage
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const { contractService } = useWeb3Manager();

useEffect(() => {
  if (!contractService) {
    console.error("[DAOGovernance] Contract service not initialized.");
  }

  if (!!contractService) {
    console.error("[DAOGovernance] Contract service initialized.");
  }
}, []);

  // Helper function to determine available features
  const canAccess = {
    basicStructure: domainLevel >= 17.59259259,
    complexGovernance: domainLevel >= 20.37037037,
    sovereignAuthority: domainLevel >= 23.14814815
  };
  
  // Add a check for contractService availability
  const isServiceReady = Boolean(contractService);

  // Modify button disabled states to account for service availability
  const buttonDisabled = !isServiceReady || !canAccess.basicStructure;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Vote className="h-5 w-5 mr-2" />
          <Typography variant="h6">Governance Controls</Typography>
        </Box>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab 
            label="DAO Structure" 
            icon={<Settings className="h-4 w-4" />}
          />
          {canAccess.complexGovernance && (
            <Tab 
              label="Advanced Controls" 
              icon={<Wallet className="h-4 w-4" />}
            />
          )}
          {canAccess.sovereignAuthority && (
            <Tab 
              label="Sovereign Powers" 
              icon={<Shield className="h-4 w-4" />}
            />
          )}
        </Tabs>

        {/* Basic DAO Structure Tab */}
        {currentTab === 0 && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Department Management
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                      disabled={buttonDisabled}
                    >
                      Manage Departments
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Policy Controls
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                      disabled={!canAccess.basicStructure}
                    >
                      Update Policies
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Complex Governance Tab */}
        {currentTab === 1 && canAccess.complexGovernance && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Parameter Control
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                    >
                      Modify Parameters
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Treasury Management
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                    >
                      Manage Treasury
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Veto Rights
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                    >
                      Review Proposals
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Sovereign Authority Tab */}
        {currentTab === 2 && canAccess.sovereignAuthority && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Sovereign Powers Active</AlertTitle>
              These controls have significant impact. Use with caution.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Emergency Controls
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="warning"
                      fullWidth
                      startIcon={<AlertTriangle />}
                    >
                      Emergency Actions
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Strategic Direction
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                    >
                      Set Strategy
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DAOGovernance;
