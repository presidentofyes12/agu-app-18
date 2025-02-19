// src/components/shared/charts/DistributionChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Define the shape of our distribution data
interface DistributionData {
  label: string;
  value: number;
  percentage: number;
}

interface DistributionChartProps {
  data: DistributionData[];
}

// Define a consistent color palette for our chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const DistributionChart: React.FC<DistributionChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${value.toLocaleString()}`, 'Amount']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
