import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ContractService } from './contractService';

// Define precise types for our metrics
interface MetricsState {
  price: string;
  supply: string;
  marketCap: string;
  treasuryBalance: string;
  fieldStrength?: number;
  fieldSynchronization?: number;
  unityProgress?: number;
  priceHistory: Array<{
    timestamp: number;
    price: number;
  }>;
}

const initializeProvider = async () => {
  if (!window.ethereum) {
    throw new Error('No Web3 provider found. Please install MetaMask.');
  }
  return new ethers.providers.Web3Provider(window.ethereum);
};

const TokenMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsState>({
    price: '0',
    supply: '0',
    marketCap: '0',
    treasuryBalance: '0',
    priceHistory: []
  });

  // Memoized format functions to prevent unnecessary re-renders
  const formatUSD = useCallback((value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  }, []);

  const formatNumber = useCallback((value: string | number) => {
    return new Intl.NumberFormat('en-US').format(Number(value));
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const provider = await initializeProvider();
      
      // Initialize contract service with retry logic
      const contractService = new ContractService(
        provider,
        '0x23767A0C9A072C6A081C27A1C03Cc95B9F9cc6E0'
      );

      const contractMetrics = await contractService.getTokenMetrics();
      
      // Update metrics with proper validation
      setMetrics(prev => ({
        ...prev,
        price: contractMetrics.price || '0',
        supply: contractMetrics.supply || '0',
        marketCap: (
          Number(contractMetrics.price) * 
          Number(contractMetrics.supply)
        ).toString(),
        treasuryBalance: contractMetrics.treasuryBalance || '0',
        fieldStrength: contractMetrics.fieldStrength,
        fieldSynchronization: contractMetrics.fieldSynchronization,
        unityProgress: contractMetrics.unityProgress,
        priceHistory: [
          ...prev.priceHistory,
          {
            timestamp: Date.now(),
            price: Number(contractMetrics.price)
          }
        ].slice(-24) // Keep last 24 data points
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metrics';
      console.error('Error fetching token metrics:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Set up polling interval for real-time updates
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent>
          <Box className="flex justify-center items-center h-64">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader title="Token Metrics" />
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Metrics */}
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle2" color="text.secondary">
                Current Price
              </Typography>
              <Typography variant="h4">
                {formatUSD(metrics.price)}
              </Typography>
            </div>
            
            <div>
              <Typography variant="subtitle2" color="text.secondary">
                Market Cap
              </Typography>
              <Typography variant="h6">
                {formatUSD(metrics.marketCap)}
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle2" color="text.secondary">
                Total Supply
              </Typography>
              <Typography variant="h6">
                {formatNumber(metrics.supply)} PITA
              </Typography>
            </div>
          </div>

          {/* Price Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={(timestamp) => {
                    return new Date(timestamp).toLocaleTimeString();
                  }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatUSD(value)}
                />
                <Tooltip 
                  formatter={(value: number) => [formatUSD(value), 'Price']}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Line 
                  type="monotone"
                  dataKey="price"
                  stroke="#8884d8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Field Metrics */}
        {metrics.fieldStrength !== undefined && (
          <div className="mt-6 space-y-4">
            <Typography variant="h6" className="mb-4">
              Field Metrics
            </Typography>
            
            <div>
              <Typography variant="subtitle2" color="text.secondary">
                Field Strength
              </Typography>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${metrics.fieldStrength}%` }}
                />
              </div>
              <Typography variant="body2" className="mt-1">
                {metrics.fieldStrength.toFixed(2)}%
              </Typography>
            </div>

            {metrics.fieldSynchronization !== undefined && (
              <div>
                <Typography variant="subtitle2" color="text.secondary">
                  Field Synchronization
                </Typography>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${metrics.fieldSynchronization}%` }}
                  />
                </div>
                <Typography variant="body2" className="mt-1">
                  {metrics.fieldSynchronization.toFixed(2)}%
                </Typography>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenMetrics;
