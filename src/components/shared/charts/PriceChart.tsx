// src/components/shared/charts/PriceChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ethers, BigNumber } from 'ethers';

export interface PriceChartProps {
  data: Array<{
    timestamp: number;
    price: number;
  }>;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  const formatUSD = (value: number | string | BigNumber) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  };
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleDateString()}
        />
        <YAxis
          tickFormatter={(value) => formatUSD(value)}
        />
        <Tooltip
          formatter={(value: number) => [formatUSD(value), 'Price']}
          labelFormatter={(label) => new Date(label * 1000).toLocaleString()}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#8884d8"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
