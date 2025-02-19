// src/components/shared/charts/ParticipationChart.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ParticipationData {
  date: string;
  averageVotes: string;
  totalVotes: string;
  participationCount: number;
}

interface ParticipationChartProps {
  data: ParticipationData[];
}

export const ParticipationChart: React.FC<ParticipationChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(date) => new Date(date).toLocaleDateString()}
        />
        <YAxis />
        <Tooltip
          formatter={(value: string) => [parseInt(value).toLocaleString(), 'Votes']}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Bar dataKey="totalVotes" fill="#8884d8" name="Total Votes" />
        <Bar dataKey="averageVotes" fill="#82ca9d" name="Average Votes" />
      </BarChart>
    </ResponsiveContainer>
  );
};
