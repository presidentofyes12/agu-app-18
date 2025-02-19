// @ts-nocheck

import React, { useEffect, useState } from 'react';
import { Router, navigate } from '@reach/router';
import { useAtom } from 'jotai';
import './custom.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

import Home from 'views/home';
import Login from 'views/login';
import InvitationForm from 'views/InvitationForm';

import Channel from 'views/channel';
import ChannelPublic from 'views/channel-public';
import DirectMessage from 'views/direct-message';
import DirectMessagePublic from 'views/direct-message-public';
import Settings from 'views/settings';
import SettingsProfile from 'views/settings/profile';
import SettingsKeys from 'views/settings/keys';
import SettingsPassword from 'views/settings/password';
import SettingsRelays from 'views/settings/relays';
import SettingsPublicLinkPage from 'views/settings/public-link';
import { keysAtom } from 'atoms';
import Dashboard from 'views/dashboard';

import { RecoilRoot } from 'recoil';
import LockPage from 'views/lock';
import LoadingComponent from 'views/components/LoadingComponent';
import Storage from 'views/components/storage';
import Calendar from 'views/components/calendar';
import OtherPage from 'views/lock/OtherPage';
import Proposal from 'views/proposal';
import NostrRelaySetup from 'views/components/relay';
import ProposalTest from 'test/ProposalTest';

import { getCredentials, getKeys } from 'local-storage';

import { Web3ReactProvider } from '@web3-react/core';

// Providers
import { ProposalProvider } from 'contexts/ProposalContext';
import { TransactionProvider } from 'contexts/TransactionContext';
import { ErrorProvider } from 'contexts/ErrorContext';
import { LoadingProvider } from 'contexts/LoadingContext';

// Components
import { LoadingOverlay, LoadingProgress } from 'components/LoadingIndicators';
import { TransactionHandler } from 'components/TransactionFlow/TransactionHandler';
import { ErrorDisplay } from 'components/ErrorHandling/ErrorDisplay';
import DAOPage from 'views/components/dashboard/DAOPage';
import { connectors } from './connectors';

import MarketplacePage from './views/components/marketplace/MarketplacePage';
import StallDetail from './views/components/marketplace/StallDetail';
import ProductDetail from './views/components/marketplace/ProductDetail';
import Cart from './views/components/marketplace/Cart';
import Checkout from './views/components/marketplace/Checkout';
import OrderHistory from './views/components/marketplace/OrderHistory';
import MerchantDashboard from './views/components/marketplace/MerchantDashboard';

function App() {
  const [keys] = useAtom(keysAtom);
  const [isLockInitialized, setIsLockInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const credentials = await getCredentials();
      const keys = await getKeys();
      setIsAuthenticated(!!credentials && !!keys);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

useEffect(() => {
  const checkLockState = () => {
    const isLocked = localStorage.getItem('isLocked') === 'true';
    if (isLocked && window.location.pathname !== '/lock') {
      window.location.href = '/lock';
    }
  };

  window.addEventListener('popstate', checkLockState);
  return () => window.removeEventListener('popstate', checkLockState);
}, []);

return (
  <>
    <RecoilRoot>
    <Web3ReactProvider connectors={connectors}>
      <ErrorProvider>
        <LoadingProvider>
            <TransactionProvider>
              <ProposalProvider>
                <ToastContainer position="bottom-right" />
                
                {/* Global Web3 Components */}
                <TransactionHandler />
                <ErrorDisplay />
                <LoadingProgress />
                
                {isLoading ? (
                  <LoadingComponent />
                ) : (
                  <Router
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LockPage path="/lock" />
                    <Login path="/login" />
                    {isLockInitialized && !isAuthenticated ? (
                      <OtherPage path="*" />
                    ) : (
                      <>
                        <Dashboard path="/home" />
                        <DAOPage path="/" />
                        <Channel path="/channel" />
                        {/* Legacy proposal route */}
                        <Proposal path="/legacy-proposals" />
                        
                        {/* Conditional routes based on keys */}
                        {keys ? (
                          <Channel path="/channel/:channel" />
                        ) : (
                          <ChannelPublic path="/channel/:channel" />
                        )}
                        {keys ? (
                          <DirectMessage path="/dm/:npub" />
                        ) : (
                          <DirectMessagePublic path="/dm/:npub" />
                        )}
                        
                        {/* Settings routes */}
                        <Settings path="/settings" />
                        <SettingsProfile path="/settings/profile" />
                        <SettingsKeys path="/settings/keys" />
                        <SettingsPassword path="/settings/password" />
                        <SettingsRelays path="/settings/relays" />
                        <SettingsPublicLinkPage path="/settings/public-link" />
                        <InvitationForm path="/invite" />

                        {/* Marketplace routes */}
                        <MarketplacePage path="/marketplace" />
                        <StallDetail path="/marketplace/stall/:stallId" />
                        <ProductDetail path="/marketplace/product/:productId" />
                        <Cart path="/marketplace/cart" />
                        <Checkout path="/marketplace/checkout" />
                        <OrderHistory path="/marketplace/orders" />
                        <MerchantDashboard path="/marketplace/merchant" />
                        
                        {/* Other routes */}
                        <Storage path="/storage" />
                        <Calendar path="/calendar" />
                        <NostrRelaySetup path="/relay"/>
                        {/* Test routes */}
                        <ProposalTest path="/test/proposals" />
                      </>
                    )}
                  </Router>
                )}
                
                {/* Loading overlay for high-priority operations */}
                <LoadingOverlay />
              </ProposalProvider>
            </TransactionProvider>
        </LoadingProvider>
      </ErrorProvider>
      </Web3ReactProvider>
    </RecoilRoot>
  </>
);
}

export default App;
