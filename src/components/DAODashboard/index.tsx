// src/components/DAODashboard/index.tsx

import React from 'react';
import { useContractEvents } from 'hooks/useContractEvents';
import { useProposals } from '../../contexts/ProposalContext';
import { DashboardMetrics } from './DashboardMetrics';
import { GovernanceOverview } from './GovernanceOverview';
import { VotingActivity } from './VotingActivity';
import { TokenAnalytics } from './TokenAnalytics';
import ProposalManagement from '../ProposalManagement';
import { WalletConnection } from 'components/shared/WalletConnection';

// Let me explain how we'll structure this dashboard to provide a complete governance interface
const DAODashboard = () => {
  // We use our established contexts to maintain consistent state
  const { isInitialized, error } = useContractEvents();
  const { activeProposals, pendingProposals } = useProposals();

  // First, let's create the layout that will tie all our components together
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed header with key metrics */}
      <DashboardHeader />

      {/* Main dashboard grid */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left column - Governance overview and metrics */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <DashboardMetrics />
            <GovernanceOverview />
            <ProposalManagement />
          </div>

          {/* Right column - Activity and analytics */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <VotingActivity />
            <TokenAnalytics />
          </div>
        </div>
      </div>
    </div>
  );
};

// Let's create each component individually, starting with the header
const DashboardHeader = () => {
  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto h-16 flex items-center justify-between">
        <h1 className="text-xl font-semibold">DAO Governance Dashboard</h1>
        <WalletConnection />
      </div>
    </header>
  );
};

export default DAODashboard;
