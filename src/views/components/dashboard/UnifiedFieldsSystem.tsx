// Main App: src/views/components/dashboard/UnifiedFieldsSystem.tsx

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  TextField
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useWeb3Manager } from 'hooks/useWeb3Manager';

// First, let's define our interfaces and types
interface FieldState {
  level: number;
  strength: number;
  synchronization: number;
  dimensionalReach: number;
  unityProgress: number;
}

interface FieldMetric {
  timestamp: string;
  strength: number;
  synchronization: number;
}

interface FieldOperationsControlProps {
  fieldState: FieldState;
  onOperation: (operation: FieldOperation) => void;
}

type FieldOperation = 'synchronize' | 'optimize' | 'evolve';

// Constants for field states
const FIELD_STATES = {
  COMPLETE_UNITY: 50.00000000,
  UNIFIED_FIELDS: {
    FIRST: 50.92592593,
    SECOND: 51.85185185,
    THIRD: 52.77777778
  },
  INTEGRATION_FIELDS: {
    PRIMARY: 53.70370370,
    SECONDARY: 54.62962963,
    TERTIARY: 55.55555556
  }
} as const;

// Field strength calculation helper
const calculateFieldStrength = (level: number): number => {
  if (level < 50) return 0;
  const normalizedLevel = (level - 50) / 50;
  return Math.pow(normalizedLevel, 2) * 100;
};

// Helper function to format operation names for display
const formatOperationName = (operation: FieldOperation): string => {
  return operation.charAt(0).toUpperCase() + operation.slice(1);
};

// Progress component with proper typing
interface ProgressProps {
  value: number;
  max: number;
}

const Progress: React.FC<ProgressProps> = ({ value, max }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className="bg-blue-600 h-2.5 rounded-full"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

const UnifiedFieldsSystem: React.FC = () => {
  const { web3State, contractService } = useWeb3Manager();
  const [fieldState, setFieldState] = useState<FieldState>({
    level: FIELD_STATES.COMPLETE_UNITY,
    strength: 0,
    synchronization: 0,
    dimensionalReach: 0,
    unityProgress: 0
  });

useEffect(() => {
  if (!contractService) {
    console.error("[UnifiedFieldsSystem] Contract service not initialized.");
  }

  if (!!contractService) {
    console.error("[UnifiedFieldsSystem] Contract service initialized.");
  }
}, []);

  // Field metrics data generation
  const getFieldMetrics = (): FieldMetric[] => {
    // This would typically fetch historical data from your contract
    // For now, returning placeholder data
    return Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      strength: fieldState.strength - i * 2,
      synchronization: fieldState.synchronization - i * 1.5
    }));
  };

  useEffect(() => {
    const loadFieldState = async () => {
      try {
        if (!contractService) {
          throw new Error("Contract service not initialized");
        }

        const currentLevel = await contractService.logicConstituent.getDomainState();
        const newFieldState: FieldState = {
          level: currentLevel,
          strength: calculateFieldStrength(currentLevel),
          synchronization: await getFieldSynchronization(),
          dimensionalReach: await getDimensionalReach(),
          unityProgress: 0 // Will be calculated after setting state
        };
        
        // Calculate unity progress after other values are set
        newFieldState.unityProgress = ((newFieldState.level - 50) / 50) * 100;
        
        setFieldState(newFieldState);
      } catch (error) {
        console.error('Failed to load field state:', error);
      }
    };

    loadFieldState();
  }, [contractService, web3State.account]);

  const getFieldSynchronization = async (): Promise<number> => {
    if (!contractService) {
      return 0;
    }
    try {
      const totalSupply = await contractService.daoToken.totalSupply();
      const dailyVolume = await contractService.daoToken.dailyAllocation();
      return (Number(dailyVolume) / Number(totalSupply)) * 100;
    } catch (error) {
      console.error('Failed to get field synchronization:', error);
      return 0;
    }
  };

const getDimensionalReach = async (): Promise<number> => {
    if (!contractService) {
        return 0;
    }
    try {
        // activeUserCount returns a BigNumber from the contract
        const activeUsers = await contractService.daoToken.activeUserCount();
        const maxUsers = 11664; // From DAOToken constant TARGET_USERS

        // Convert the BigNumber to a regular number before arithmetic operations
        const activeUsersNumber = activeUsers.toNumber();

        // Now we can safely perform the percentage calculation
        const percentage = (activeUsersNumber / maxUsers) * 100;

        // Ensure we don't exceed 100%
        return Math.min(percentage, 100);
    } catch (error) {
        console.error('Failed to get dimensional reach:', error);
        return 0;
    }
};

  const handleFieldOperation = async (operation: FieldOperation) => {
    if (!contractService) {
      console.error('Contract service not initialized');
      return;
    }

    try {
      switch (operation) {
        case 'synchronize':
          await contractService.logicConstituent.synchronizeField();
          break;
        case 'optimize':
          await contractService.logicConstituent.optimizeField();
          break;
        case 'evolve':
          await contractService.logicConstituent.evolveField();
          break;
      }
      // Reload field state after operation
      const currentLevel = await contractService.logicConstituent.getDomainState();
      setFieldState(prev => ({
        ...prev,
        level: currentLevel,
        strength: calculateFieldStrength(currentLevel)
      }));
    } catch (error) {
      console.error(`Failed to perform field operation ${operation}:`, error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Unified Fields</h2>
          <p className="text-sm text-gray-500">
            Current Level: {fieldState.level.toFixed(8)}
          </p>
        </div>

        <div className="space-y-6">
          {/* Field Strength Indicator */}
          <div>
            <label className="text-sm font-medium">Field Strength</label>
            <Progress value={fieldState.strength} max={100} />
            <p className="text-sm text-gray-500">
              {fieldState.strength.toFixed(2)}% Capacity
            </p>
          </div>

          {/* Synchronization Status */}
          <div>
            <label className="text-sm font-medium">Field Synchronization</label>
            <Progress value={fieldState.synchronization} max={100} />
            <p className="text-sm text-gray-500">
              {fieldState.synchronization.toFixed(2)}% Synchronized
            </p>
          </div>

          {/* Field Metrics Visualization */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getFieldMetrics()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="strength" 
                  stroke="#8884d8" 
                  name="Field Strength"
                />
                <Line 
                  type="monotone" 
                  dataKey="synchronization" 
                  stroke="#82ca9d"
                  name="Synchronization"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Unity Progress */}
          {fieldState.level >= FIELD_STATES.UNIFIED_FIELDS.FIRST && (
            <div>
              <label className="text-sm font-medium">Progress to Unity</label>
              <Progress value={fieldState.unityProgress} max={100} />
              <p className="text-sm text-gray-500">
                {fieldState.unityProgress.toFixed(2)}% Complete
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Field Operations Control */}
      <FieldOperationsControl 
        fieldState={fieldState}
        onOperation={handleFieldOperation}
      />
    </div>
  );
};

// Field Operations Control Component
const FieldOperationsControl: React.FC<FieldOperationsControlProps> = ({ 
  fieldState, 
  onOperation 
}) => {
  const getAvailableOperations = (): FieldOperation[] => {
    if (fieldState.level >= FIELD_STATES.INTEGRATION_FIELDS.PRIMARY) {
      return ['synchronize', 'optimize', 'evolve'];
    }
    if (fieldState.level >= FIELD_STATES.UNIFIED_FIELDS.FIRST) {
      return ['synchronize', 'optimize'];
    }
    return ['synchronize'];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Field Operations</h3>
      <div className="space-y-4">
        {getAvailableOperations().map(operation => (
          <button
            key={operation}
            onClick={() => onOperation(operation)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {formatOperationName(operation)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UnifiedFieldsSystem;
