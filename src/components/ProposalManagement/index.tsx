// src/components/ProposalManagement/index.tsx

import React, { useEffect, useState } from 'react';
import { useProposalCreation } from 'hooks/useProposalCreation';
import { useProposals } from '../../contexts/ProposalContext';
import { ProposalState } from '../../types/contracts';
import { useContractEvents } from 'hooks/useContractEvents';
// import Proposal from 'views/components/dashboard/VotingInterface';
import { Proposal } from 'services/ProposalLifecycle';

/*
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
*/

import { 
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Button,
  TextField,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import { Loader2, MessageSquare, Clock, Users, AlertTriangle } from 'lucide-react';

import useToast from 'hooks/use-toast';

import { ethers } from 'ethers';

const PROPOSAL_CATEGORIES = [
  { id: 1, name: 'Governance', description: 'Changes to DAO governance parameters' },
  { id: 2, name: 'Treasury', description: 'Treasury fund allocation' },
  { id: 3, name: 'Technical', description: 'Technical improvements or upgrades' },
  { id: 4, name: 'Community', description: 'Community initiatives and programs' }
];

///// Keep outside

// Format remaining time in a human-readable way
const formatTimeRemaining = (timestamp: number): string => {
  const diff = timestamp * 1000 - Date.now();
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Calculate percentage for vote display
const calculatePercentage = (votes: ethers.BigNumber, total: ethers.BigNumber): number => {
  if (total.isZero()) return 0;
  // Convert to number with 2 decimal places
  return parseFloat(votes.mul(10000).div(total).toString()) / 100;
};

// Add proposal discussion sorting and filtering capabilities
interface DiscussionFilters {
  sortBy: 'latest' | 'oldest' | 'mostReplies';
  participantType: 'all' | 'voters' | 'core';
  searchTerm: string;
}

// Add proposal history tracking
/*interface ProposalHistoryEntry {
  timestamp: number;
  type: 'creation' | 'discussion' | 'submission' | 'vote' | 'execution' | 'cancellation';
  data: any;
  transactionHash?: string;
}*/

interface ProposalHistoryEntry {
  state: ProposalState;
  type: 'creation' | 'discussion' | 'submission' | 'vote' | 'execution' | 'cancellation';
  timestamp: number;
  txHash?: string;
  metadata?: any;
}

///// Move inside

// Add notification management for proposal events
const useProposalNotifications = (proposalId: string) => {
  const { subscribeToProposalEvents } = useProposals();
  //const { toast } = useToast();
  const [, showMessage] = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToProposalEvents(proposalId, {
      onVoteCast: ({ voter, support }) => {
        showMessage(
          "Address ${voter} voted ${support ? 'for' : 'against'} the proposal.",
          "success"
        ); // title: "New Vote Cast",
      },
      onStateChange: ({ fromState, toState }) => {
        showMessage(
          "State changed from ${fromState} to ${toState}",
          "success"
        ); // title: "Proposal State Changed",
      },
      onDiscussionUpdate: () => {
        showMessage(
          "The proposal discussion has been updated.",
          "success"
        ); // title: "New Discussion Comment",
      },
    });

    return () => unsubscribe();
  }, [proposalId]);
};

// Add helper component for displaying proposal metadata
const ProposalMetadata = ({ 
  proposal 
}: { 
  proposal: Proposal 
}) => (
  <div className="grid grid-cols-2 gap-4 text-sm">
    <div>
      <div className="text-muted-foreground">Category</div>
      <div className="font-medium">
        {PROPOSAL_CATEGORIES.find(c => c.id === proposal.category)?.name}
      </div>
    </div>
    <div>
      <div className="text-muted-foreground">Creator</div>
      <div className="font-medium">{proposal.creator}</div>
    </div>
    <div>
      <div className="text-muted-foreground">Created</div>
      <div className="font-medium">
        {new Date(proposal.createdAt * 1000).toLocaleDateString()}
      </div>
    </div>
    <div>
      <div className="text-muted-foreground">Status</div>
      <div className="font-medium">{proposal.currentState}</div>
    </div>
  </div>
);

const ProposalManagement = () => {
  const {
    startProposalCreation,
    submitToChain,
    addDiscussionComment,
    updateProposal,
    isCreating,
    isSubmitting,
    error,
    currentProposal,
    discussionStats,
    canSubmitToChain,
    validateProposalParams,
    getDiscussionTimeRemaining
  } = useProposalCreation();
  
  const [, showMessage] = useToast();
  
  const { castVote } = useContractEvents();

  const { activeProposals, pendingProposals, completedProposals } = useProposals();
  
  const { 
    voterAddresses
    // ... other context values 
  } = useProposals();
  
  const { getProposalTimeline } = useProposals();

const filterAndSortDiscussion = (
  comments: Array<{
    id: string;
    content: string;
    author: string;
    timestamp: number;
    replies: number;
  }>,
  filters: DiscussionFilters
) => {
  let filtered = [...comments];

  // Apply participant type filter
  if (filters.participantType !== 'all') {
    filtered = filtered.filter(comment => {
      if (filters.participantType === 'voters') {
        return voterAddresses.has(comment.author);
      }
      return true;
    });
  }

  // Apply search filter
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(comment =>
      comment.content.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case 'oldest':
        return a.timestamp - b.timestamp;
      case 'mostReplies':
        return b.replies - a.replies;
      case 'latest':
      default:
        return b.timestamp - a.timestamp;
    }
  });

  return filtered;
};

const ProposalHistory = ({ proposalId }: { proposalId: string }) => {
  const [history, setHistory] = useState<ProposalHistoryEntry[]>([]);
  const { getProposalTimeline } = useProposals();

  /*useEffect(() => {
    const fetchHistory = async () => {
      try {
        const timeline = await getProposalTimeline(proposalId);
        setHistory(timeline);
      } catch (error) {
        console.error('Error fetching proposal history:', error);
      }
    };

    fetchHistory();
  }, [proposalId]);*/

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (!getProposalTimeline) {
          throw new Error("getProposalTimeline does not exist yet!");
        }
        const timeline = await getProposalTimeline(proposalId);
        
        if (timeline) {
          // Transform timeline data to match ProposalHistoryEntry interface
          const transformedTimeline: ProposalHistoryEntry[] = timeline.map(entry => ({
            ...entry,
            // Map state to appropriate type
            type: mapStateToType(entry.state),
          }));
          setHistory(transformedTimeline);
        } else {
          setHistory([]); 
        }
      } catch (error) {
        console.error('Error fetching proposal history:', error);
        setHistory([]);
      }
    };

    fetchHistory();
  }, [proposalId]);

  // Helper function to map ProposalState to history entry type
  const mapStateToType = (state: ProposalState): ProposalHistoryEntry['type'] => {
    switch (state) {
      case ProposalState.DRAFT:
        return 'creation';
      case ProposalState.DISCUSSION:
        return 'discussion';
      case ProposalState.SUBMITTED:
        return 'submission';
      case ProposalState.EXECUTED:
        return 'execution';
      case ProposalState.CANCELED:
        return 'cancellation';
      default:
        if (state === ProposalState.ACTIVE || 
            state === ProposalState.SUCCEEDED || 
            state === ProposalState.DEFEATED) {
          return 'vote';
        }
        return 'submission'; // fallback for other states
    }
  };

  return (
    <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
      {history.map((entry, index) => (
        <div key={index} className="flex items-start space-x-4">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {index < history.length - 1 && (
              <div className="w-0.5 h-full bg-primary/20" />
            )}
          </div>
          <div>
            <div className="font-medium">
              {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(entry.timestamp * 1000).toLocaleString()}
            </div>
            {entry.txHash && (
              <a
                href={`https://scan.pls.com/tx/${entry.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Transaction
              </a>
            )}
            {entry.metadata && (
              <div className="text-sm text-muted-foreground mt-1">
                {JSON.stringify(entry.metadata)}
              </div>
            )}
          </div>
        </div>
      ))}
    </Box>
  );
};

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    discussionPeriod: '2', // Default 2 days
    votingPeriod: '3',     // Default 3 days
    comment: ''            // For discussion thread
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('create');

  const handleCreateProposal = async () => {
    const { isValid, errors } = validateProposalParams(
      formData.title,
      formData.description,
      parseInt(formData.category),
      {
        discussionPeriod: parseInt(formData.discussionPeriod) * 24 * 60 * 60,
        votingPeriod: parseInt(formData.votingPeriod) * 24 * 60 * 60
      }
    );

    if (!isValid) {
      setValidationErrors(errors);
      return;
    }

    try {
      const proposalId = await startProposalCreation(
        formData.title,
        formData.description,
        parseInt(formData.category),
        {
          discussionPeriod: parseInt(formData.discussionPeriod) * 24 * 60 * 60,
          votingPeriod: parseInt(formData.votingPeriod) * 24 * 60 * 60
        }
      );

      // Reset form and switch to discussion tab
      setFormData({
        title: '',
        description: '',
        category: '',
        discussionPeriod: '2',
        votingPeriod: '3',
        comment: ''
      });
      setActiveTab('discussion');
    } catch (err) {
      console.error('Error creating proposal:', err);
    }
  };

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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

  const handleSubmitComment = async () => {
    if (!currentProposal || !formData.comment.trim()) return;

    try {
      await addDiscussionComment(currentProposal.id, formData.comment);
      setFormData(prev => ({ ...prev, comment: '' }));
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  const handleSubmitToChain = async () => {
    if (!currentProposal) return;

    const { canSubmit, reason } = canSubmitToChain(currentProposal.id);
    if (!canSubmit) {
      setValidationErrors([reason!]);
      return;
    }

    try {
      await submitToChain(currentProposal.id);
      setActiveTab('active');
    } catch (err) {
      console.error('Error submitting to chain:', err);
    }
  };

// Handle vote button clicks with confirmation
const handleVoteClick = async (proposalId: string, support: boolean) => {
  const vote = async () => {
    try {
      await castVote(proposalId, support);
      // Show success message and update UI
      showMessage(
        "You voted ${support ? 'for' : 'against'} the proposal.",
        "success"
      ); // title: "Vote Cast Successfully",
    } catch (error) {
      console.error('Error casting vote:', error);
      showMessage(
        (error instanceof Error ? error.message : "Failed to cast vote"),
        "error"
      ); // variant: "destructive",
      // title: "Error Casting Vote",
    }
  };

  /*// Show confirmation dialog before voting
  const dialog = await Dialog.confirm({
    title: `Confirm Vote ${support ? 'For' : 'Against'}`,
    body: `Are you sure you want to vote ${support ? 'for' : 'against'} this proposal? This action cannot be undone.`,
    confirmText: 'Confirm Vote',
    cancelText: 'Cancel'
  });

  if (dialog.confirmed) {
    await vote();
  }*/
  
  await vote(); // will reinstate confirmation soon
};

/*
            {currentProposal?.state === ProposalState.DISCUSSION && (
              <span className="ml-2 text-xs bg-primary/20 px-2 py-1 rounded-full">
                Active
              </span>
            )}
*/

  return (
    <div className="container mx-auto p-6 space-y-6">
<Tabs 
  value={activeTab} 
  onChange={(e, newValue) => setActiveTab(newValue)}
  sx={{ borderBottom: 1, borderColor: 'divider' }}
>
  <Tab label="Create Proposal" value="create" />
          <Tab label="Discussion" value="discussion" />
          
          <Tab label="Active Proposals" value="active"/>
          <Tab label="Completed" value="completed"/>
        </Tabs>

        {/* Create Proposal Tab */}
        <TabPanel value={activeTab} index="create">
          <Card>
            <CardHeader title="Create New Proposal" subheader="Start a new proposal for the DAO to consider. The proposal will go through a discussion period before being submitted on-chain for voting."/>
            <CardContent sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
              {validationErrors.length > 0 && (
                <Alert severity="error">
                  <AlertTitle>Validation Errors</AlertTitle>
                  <Typography variant="body2">
                    <ul className="list-disc pl-4">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </Typography>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
<TextField
  fullWidth
  id="title"
  label="Title"
  variant="outlined"
  value={formData.title}
  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}))}
  placeholder="Enter proposal title"
  disabled={isCreating}
/>
{/*onChange={(e: SelectChangeEvent<string>) => setFormData(prev => ({...prev, value: e.target.value}))}*/}
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <TextField multiline
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}))}
                  placeholder="Describe your proposal in detail"
                  disabled={isCreating}
                  className="min-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
<FormControl fullWidth>
  <InputLabel id="category-label">Category</InputLabel>
  <Select
    labelId="category-label"
    value={formData.category}
    onChange={(e: SelectChangeEvent<string>) => setFormData(prev => ({...prev, category: e.target.value}))}
    disabled={isCreating}
  >
    {PROPOSAL_CATEGORIES.map(category => (
      <MenuItem key={category.id} value={category.id.toString()}>
        {category.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
                </div>

                <div className="space-y-2">
                  <label htmlFor="discussionPeriod" className="text-sm font-medium">
                    Discussion Period (days)
                  </label>
<TextField
  id="discussionPeriod"
  type="number"
  InputProps={{
    inputProps: {
      min: 1,
      max: 7
    }
  }}
  value={formData.discussionPeriod}
  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
    setFormData(prev => ({...prev, [e.target.name]: e.target.value}))}
  disabled={isCreating}
/>
                </div>
              </div>
            </CardContent>
            <CardActions>
              <Button 
                onClick={handleCreateProposal}
                disabled={isCreating || !formData.title || !formData.description || !formData.category}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Proposal...
                  </>
                ) : (
                  'Create Proposal'
                )}
              </Button>
            </CardActions>
          </Card>
        </TabPanel>

        {/* Discussion Tab */}
        <TabPanel value="discussion" index="discussion">
          {currentProposal?.state === ProposalState.DISCUSSION ? (
            <Card>
              <CardHeader>
                <Typography variant="h6">{currentProposal.title}</Typography>
                <Typography variant="body2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {getDiscussionTimeRemaining()}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {discussionStats.commentCount} comments
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      {discussionStats.uniqueParticipants.size} participants
                    </div>
                  </div>
                </Typography>
              </CardHeader>
              <CardContent sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
                {/* Discussion Thread */}
                <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
                  {/* Comment input */}
                  <div className="space-y-2">
<TextField
  multiline
  rows={4}  // Instead of className="min-h-[100px]"
  fullWidth
  value={formData.comment}
  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}))}
  placeholder="Add to the discussion..."
/>
                    <Button 
                      onClick={handleSubmitComment}
                      disabled={!formData.comment.trim()}
                    >
                      Add Comment
                    </Button>
                  </div>

                  {/* Submit to Chain button */}
                  {canSubmitToChain(currentProposal.id).canSubmit && (
                    <div className="mt-6">
                      <Button
                        onClick={handleSubmitToChain}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting to Chain...
                          </>
                        ) : (
                          'Submit Proposal to Chain'
                        )}
                      </Button>
                    </div>
                  )}
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No active discussion
                </div>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Active Proposals Tab */}
        <TabPanel value="active" index="active">
          <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
            {activeProposals.map(proposal => (
              <Card key={proposal.id}>
                <CardHeader>
                  <Typography variant="h6">{proposal.title}</Typography>
                  <Typography variant="body2">
                    Voting ends in {formatTimeRemaining(proposal.votingEndTime)}
                  </Typography>
                </CardHeader>
                <CardContent>
                  {/* Voting progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>For</span>
                      <span>{calculatePercentage(proposal.forVotes, proposal.votingPower)}%</span>
                    </div>
<LinearProgress 
  variant="determinate" 
  value={calculatePercentage(proposal.forVotes, proposal.votingPower)}
  sx={{ height: 8, borderRadius: 1 }}
/>
                    
                    <div className="flex justify-between text-sm">
                      <span>Against</span>
                      <span>{calculatePercentage(proposal.againstVotes, proposal.votingPower)}%</span>
                    </div>
<LinearProgress 
  variant="determinate" 
  value={calculatePercentage(proposal.againstVotes, proposal.votingPower)}
  sx={{ height: 8, borderRadius: 1 }}
/>
                  </div>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="outlined"
                    onClick={() => handleVoteClick(proposal.id, true)}
                  >
                    Vote For
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => handleVoteClick(proposal.id, false)}
                    className="ml-2"
                  >
                    Vote Against
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Completed Proposals Tab */}
        <TabPanel value="completed" index="completed">
          <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
            {completedProposals.map(proposal => (
              <Card key={proposal.id}>
                <CardHeader>
<Typography 
  variant="h6" 
  sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  }}
>
  {proposal.title}
                    <span className={`text-sm ${
                      proposal.currentState === ProposalState.EXECUTED ? 'text-green-500' :
                      proposal.currentState === ProposalState.DEFEATED ? 'text-red-500' :
                      'text-orange-500'
                    }`}>
                      {proposal.currentState}
                    </span>
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Final Results:
                    <div className="mt-2 space-y-1">
                      <div>For: {calculatePercentage(proposal.forVotes, proposal.votingPower)}%</div>
                      <div>Against: {calculatePercentage(proposal.againstVotes, proposal.votingPower)}%</div>
                      <div>Total Votes: {ethers.utils.formatEther(proposal.votingPower)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>
    </div>
  );
};

// Main export
export default ProposalManagement;
