// Main App: src/views/components/dashboard/AnonymousTransactions.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import { AlertColor } from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3Manager } from '../../../hooks/useWeb3Manager';

// Define interface for transaction object
interface Transaction {
  txHash: string;
  recipient: string;
  amount: ethers.BigNumber;  // Change from string to BigNumber
  creationTime: number;
  claimed: boolean;
  condition: string;
  publicKeyHash: string;    // Add to match AnonymousTransaction
  conditionHash: string;    // Add to match AnonymousTransaction
}

// Enhanced type definitions to match contract structures
interface AnonymousTransaction {
  publicKeyHash: string;
  recipient: string;
  amount: ethers.BigNumber;
  creationTime: number;
  claimed: boolean;
  conditionHash: string;
  txHash?: string;
}

// Add this interface near the top with other interfaces
interface AnonymousTransactionEvent {
  args: {
    txHash: string;
    recipient: string;
    amount: ethers.BigNumber;
    timestamp: number;
  };
}

interface IntegrationContext {
  level: number;
  powerDomain: boolean;
  maxTransactionValue: bigint;
  crossDAOEnabled: boolean;
}

interface TransactionForm {
  recipient: string;
  amount: string;
  condition: string;
  publicKey: string;
}

interface ClaimForm {
  signature: string;
  condition: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

// Placeholder data with proper typing
const PLACEHOLDER_TRANSACTIONS: Transaction[] = [
  {
    txHash: '0x1234...5678',
    recipient: '0xabcd...ef12',
    amount: ethers.utils.parseEther('1000'),  // Convert to BigNumber
    creationTime: Date.now() - 86400000,
    claimed: false,
    condition: 'Time lock until 2024-02-01',
    publicKeyHash: '0x000000000000000',
    conditionHash: '0x000000000000000'
  },
  {
    txHash: '0x5678...9012',
    recipient: '0xef12...3456',
    amount: ethers.utils.parseEther('500'),  // Convert to BigNumber
    creationTime: Date.now() - 172800000,
    claimed: true,
    condition: 'Requires specific signature',
    publicKeyHash: '0x000000000000000',
    conditionHash: '0x000000000000000'
  }
];

// Component props interface
interface AnonymousTransactionsProps {
  integrationContext?: IntegrationContext;
}

const AnonymousTransactions: React.FC<AnonymousTransactionsProps> = ({ integrationContext }) => {
  // State management with proper typing
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [crossDAOMode, setCrossDAOMode] = useState<boolean>(false);
  /*const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });*/

  const [newTxForm, setNewTxForm] = useState<TransactionForm>({
    recipient: '',
    amount: '',
    condition: '',
    publicKey: ''
  });

  const [claimForm, setClaimForm] = useState<ClaimForm>({
    signature: '',
    condition: ''
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const { web3State, contractService } = useWeb3Manager();
  //const [loading, setLoading] = useState(false);
  //const [transactions, setTransactions] = useState<AnonymousTransaction[]>([]);
  //const [selectedTx, setSelectedTx] = useState<AnonymousTransaction | null>(null);
  //const [createDialogOpen, setCreateDialogOpen] = useState(false);
  //const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  //const [crossDAOMode, setCrossDAOMode] = useState(false);

  // Generic function to handle form field changes
  /*function handleFormChange<T extends TransactionForm | ClaimForm>(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<T>>,
    field: keyof T
  ) {
    setter(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  }*/

useEffect(() => {
  if (!contractService) {
    console.error("[AnonymousTransactions] Contract service not initialized.");
  }

  if (!!contractService) {
    console.error("[AnonymousTransactions] Contract service initialized.");
  }
}, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    form: 'new' | 'claim'
  ) => {
    const { name, value } = e.target;
    if (form === 'new') {
      setNewTxForm(prev => ({ ...prev, [name]: value }));
    } else {
      setClaimForm(prev => ({ ...prev, [name]: value }));
    }
  };

useEffect(() => {
  const loadTransactions = async () => {
    if (!contractService?.daoToken) return;

    try {
      setLoading(true);
      const filter = contractService.daoToken.filters.AnonymousTransaction();
      const events = await contractService.daoToken.queryFilter(filter);
      
      const txs = await Promise.all(events.map(async (event) => {
        const typedEvent = event as unknown as AnonymousTransactionEvent;
        if (!typedEvent.args) {
          throw new Error('Invalid event format');
        }

        const tx = await contractService.daoToken.anonymousTransactions(typedEvent.args.txHash);
        
        // Transform the contract data into our UI's Transaction type
        // by adding the 'condition' field derived from conditionHash
        const transformedTx: Transaction = {
          ...tx,
          txHash: typedEvent.args.txHash,
          // We need to store the original condition hash but also provide a human-readable condition
          condition: `Condition for ${typedEvent.args.txHash.slice(0, 8)}...`,
          // Keep other required fields from AnonymousTransaction
          publicKeyHash: tx.publicKeyHash,
          conditionHash: tx.conditionHash
        };

        return transformedTx;
      }));

      setTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
      showError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  loadTransactions();
}, [contractService?.daoToken]);

  const showError = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  const showSuccess = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  // Event handlers with proper typing
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCreateTransaction = async () => {
    if (!contractService?.daoToken || !web3State.account) return;

    setLoading(true);
    try {
      if (!integrationContext?.powerDomain) {
        throw new Error('Power Domain access required');
      }

      const publicKeyHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(newTxForm.publicKey)
      );
      
      const conditionHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(newTxForm.condition)
      );

      const tx = await contractService.daoToken.createAnonymousTransaction(
        publicKeyHash,
        newTxForm.recipient,
        ethers.utils.parseEther(newTxForm.amount),
        conditionHash
      );

      await tx.wait();
      
      showSuccess('Transaction created successfully');
      setCreateDialogOpen(false);
      
      // Reset form
      setNewTxForm({
        recipient: '',
        amount: '',
        condition: '',
        publicKey: ''
      });

    } catch (error) {
      console.error('Error creating transaction:', error);
      showError(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

// Update the handleClaimTransaction function signature to accept Transaction type
const handleClaimTransaction = async (tx: Transaction) => {
  if (!contractService?.daoToken || !tx.txHash) return;

  setLoading(true);
  try {
    const claimTx = await contractService.daoToken.claimAnonymousTransaction(
      tx.txHash,
      claimForm.signature,
      ethers.utils.toUtf8Bytes(claimForm.condition)
    );

    await claimTx.wait();

    showSuccess('Transaction claimed successfully');
    setClaimDialogOpen(false);
    setClaimForm({ signature: '', condition: '' });

    // Update local state
    setTransactions(prev => 
      prev.map(t => 
        t.txHash === tx.txHash ? { ...t, claimed: true } : t
      )
    );

  } catch (error) {
    console.error('Error claiming transaction:', error);
    showError('Failed to claim transaction');
  } finally {
    setLoading(false);
  }
};

  return (
    <Card>
      <CardContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Transactions" />
            <Tab label="Create New" />
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <Box>
            <Paper sx={{ overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction Hash</TableCell>
                    <TableCell>Recipient</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.txHash}>
                      <TableCell>{tx.txHash}</TableCell>
                      <TableCell>{tx.recipient}</TableCell>
                      <TableCell>{ethers.utils.formatEther(tx.amount)} PITA</TableCell>
                      <TableCell>
                        {new Date(tx.creationTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Alert severity={tx.claimed ? "success" : "info"} sx={{ py: 0 }}>
                          {tx.claimed ? 'Claimed' : 'Pending'}
                        </Alert>
                      </TableCell>
                      <TableCell>
                        {!tx.claimed && (
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setSelectedTx(tx);
                              setClaimDialogOpen(true);
                            }}
                          >
                            Claim
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {currentTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <Typography variant="subtitle1">
                Create New Anonymous Transaction
              </Typography>

              <TextField
                label="Recipient Address"
                value={newTxForm.recipient}
                onChange={(e) => handleFormChange(e, 'new')}
                fullWidth
              />

              <TextField
                label="Amount (PITA)"
                type="number"
                value={newTxForm.amount}
                onChange={(e) => handleFormChange(e, 'new')}
                fullWidth
              />

              <TextField
                label="Condition (Optional)"
                value={newTxForm.condition}
                onChange={(e) => handleFormChange(e, 'new')}
                multiline
                rows={2}
                fullWidth
                helperText="Add conditions for claiming this transaction"
              />

              <Button
                variant="contained"
                onClick={handleCreateTransaction}
                disabled={loading || !newTxForm.recipient || !newTxForm.amount}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Create Anonymous Transaction'
                )}
              </Button>
            </Stack>
          </Box>
        )}

        <Dialog
          open={claimDialogOpen}
          onClose={() => setClaimDialogOpen(false)}
        >
          <DialogTitle>Claim Anonymous Transaction</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2, minWidth: 400 }}>
              <TextField
                label="Signature"
                value={claimForm.signature}
                onChange={(e) => handleFormChange(e, 'claim')}
                fullWidth
                required
              />

<TextField
  label="Condition Data"
  value={claimForm.condition}
  onChange={(e) => handleFormChange(e, 'claim')}  // Remove the third argument
  multiline
  rows={2}
  fullWidth
  required
/>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setClaimDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => selectedTx && handleClaimTransaction(selectedTx)}
              disabled={loading || !claimForm.signature}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                'Claim Transaction'
              )}
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
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {integrationContext?.powerDomain && (
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={crossDAOMode}
                  onChange={(e) => setCrossDAOMode(e.target.checked)}
                  disabled={!integrationContext.crossDAOEnabled}
                />
              }
              label="Cross-DAO Transaction"
            />
            {crossDAOMode && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Transaction will be routed through integration layer
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AnonymousTransactions;
