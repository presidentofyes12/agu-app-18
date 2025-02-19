// src/hooks/useTokenAnalytics.ts

import { useState, useEffect } from 'react';
import { ethers, BigNumber } from 'ethers';
import { useContractEvents } from './useContractEvents';

// Define interfaces for our token analytics data
interface TokenMetrics {
  price: BigNumber;
  marketCap: BigNumber;
  circulatingSupply: BigNumber;
  totalSupply: BigNumber;
  stakedAmount: BigNumber;
  stakedPercentage: number;
  holderCount: number;
  fieldStrength?: number;
  fieldSynchronization?: number;
  unityProgress?: number;
}

interface PriceDataPoint {
  timestamp: number;
  price: number;
}

interface DistributionDataPoint {
  label: string;
  value: number;
  percentage: number;
}

interface TokenAnalytics {
  tokenMetrics: TokenMetrics;
  priceHistory: PriceDataPoint[];
  distribution: DistributionDataPoint[];
  isLoading: boolean;
  error: Error | null;
}

export function useTokenAnalytics(): TokenAnalytics {
  const { daoToken } = useContractEvents();
  const [analytics, setAnalytics] = useState<TokenAnalytics>({
    tokenMetrics: {
      price: BigNumber.from(0),
      marketCap: BigNumber.from(0),
      circulatingSupply: BigNumber.from(0),
      totalSupply: BigNumber.from(0),
      stakedAmount: BigNumber.from(0),
      stakedPercentage: 0,
      holderCount: 0
    },
    priceHistory: [],
    distribution: [],
    isLoading: true,
    error: null
  });

  // Function to fetch token metrics
  const fetchTokenMetrics = async () => {
    if (!daoToken) return;

    try {
      // Fetch basic token metrics
      const [
        currentPrice,
        totalSupply,
        stakedAmount,
        holderCount
      ] = await Promise.all([
        daoToken.currentDailyPrice(),
        daoToken.totalSupply(),
        daoToken.totalStaked(),
        daoToken.getHolderCount()
      ]);

      // Calculate derived metrics
      const circulatingSupply = totalSupply.sub(stakedAmount);
      const marketCap = currentPrice.mul(circulatingSupply);
      const stakedPercentage = stakedAmount.mul(100).div(totalSupply).toNumber();

      // Update state with new metrics
      setAnalytics(prev => ({
        ...prev,
        tokenMetrics: {
          price: currentPrice,
          marketCap,
          circulatingSupply,
          totalSupply,
          stakedAmount,
          stakedPercentage,
          holderCount: holderCount.toNumber()
        },
        isLoading: false
      }));
    } catch (error) {
      setAnalytics(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
    }
  };

  // Function to fetch price history
  const fetchPriceHistory = async () => {
    if (!daoToken) return;

    try {
      // Fetch daily price updates for the last 30 days
      const priceEvents = await daoToken.queryFilter(
        daoToken.filters.DailyPriceUpdated(),
        -30 * 24 * 60 * 4 // Approximately 30 days worth of blocks (15s block time)
      );

      const priceHistory = await Promise.all(
        priceEvents.map(async (event) => {
          const block = await event.getBlock();
          return {
            timestamp: block.timestamp,
            price: parseFloat(ethers.utils.formatEther(event.args?.price))
          };
        })
      );

      setAnalytics(prev => ({
        ...prev,
        priceHistory: priceHistory.sort((a, b) => a.timestamp - b.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  // Function to fetch token distribution
  const fetchDistribution = async () => {
    if (!daoToken) return;

    try {
      // Get distribution ranges (example implementation)
      const ranges = [
        { min: 0, max: 1000, label: '0-1k' },
        { min: 1000, max: 10000, label: '1k-10k' },
        { min: 10000, max: 100000, label: '10k-100k' },
        { min: 100000, max: Infinity, label: '100k+' }
      ];

      const distribution = await Promise.all(
        ranges.map(async (range) => {
          const holdersInRange = await daoToken.getHoldersInRange(
            range.min,
            range.max
          );

          return {
            label: range.label,
            value: holdersInRange.toNumber(),
            percentage: 0 // Will calculate after getting all values
          };
        })
      );

      // Calculate percentages
      const total = distribution.reduce((sum, d) => sum + d.value, 0);
      const distributionWithPercentages = distribution.map(d => ({
        ...d,
        percentage: (d.value / total) * 100
      }));

      setAnalytics(prev => ({
        ...prev,
        distribution: distributionWithPercentages
      }));
    } catch (error) {
      console.error('Error fetching distribution:', error);
    }
  };

  // Set up effect to fetch data and handle updates
  useEffect(() => {
    if (!daoToken) return;

    // Initial fetch
    fetchTokenMetrics();
    fetchPriceHistory();
    fetchDistribution();

    // Set up listeners for relevant events
    const priceUpdateFilter = daoToken.filters.DailyPriceUpdated();
    const transferFilter = daoToken.filters.Transfer();
    const stakeFilter = daoToken.filters.Staked();

    const handlePriceUpdate = () => {
      fetchTokenMetrics();
      fetchPriceHistory();
    };

    const handleTransfer = () => {
      fetchTokenMetrics();
      fetchDistribution();
    };

    daoToken.on(priceUpdateFilter, handlePriceUpdate);
    daoToken.on(transferFilter, handleTransfer);
    daoToken.on(stakeFilter, handleTransfer);

    // Polling interval for regular updates
    const interval = setInterval(fetchTokenMetrics, 60000); // Update every minute

    return () => {
      daoToken.off(priceUpdateFilter, handlePriceUpdate);
      daoToken.off(transferFilter, handleTransfer);
      daoToken.off(stakeFilter, handleTransfer);
      clearInterval(interval);
    };
  }, [daoToken]);

  return analytics;
}
