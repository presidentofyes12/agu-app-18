import React, { useState, useEffect } from 'react';
import { Box, Stepper, Step, StepLabel, Card, TextField, Button, FormControl, Select, MenuItem, Typography, List, ListItem, ListItemText } from '@mui/material';
import { UniversalLegalFramework } from './UniversalLegalFramework';

import { PartyStatusConfig } from './config/PartyStatusConfig';
import { JurisdictionConfig } from './config/JurisdictionConfig';
import { ConsiderationConfig } from './config/ConsiderationConfig';
import { AdequacyConfig } from './config/AdequacyConfig';
import { LegalFrameworkPreview } from './config/LegalFrameworkPreview';

interface LegalState {
  baseValue: number; // 0-8.33
  relationshipValue: number; // 8.33-16.67  
  obligationValue: number; // 41.67-50.00
  valueLayerValue: number; // 47.22-50.00
}

export interface PartyConfiguration {
  individualStatus: number; // 2.77-3.70
  entityStatus: number; // 3.70-4.63
  collectiveStatus: number; // 4.63-5.55
}

export interface LegalConfiguration {
  values: LegalState;
  partyStatus: PartyConfiguration;
  jurisdictionCode: number; // 8.33-16.67
  authorityLevel: number; // Maps to legal powers
  considerationValue: number; // 41.67-42.59
  adequacyMeasure: number; // 47.22-48.15
}

export const LegalFrameworkBuilder: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<LegalConfiguration>({
    values: {
      baseValue: 0,
      relationshipValue: 8.33,
      obligationValue: 41.67,
      valueLayerValue: 47.22
    },
    partyStatus: {
      individualStatus: 2.77,
      entityStatus: 3.70,
      collectiveStatus: 4.63
    },
    jurisdictionCode: 8.33,
    authorityLevel: 13.88,
    considerationValue: 41.67,
    adequacyMeasure: 47.22
  });

  const steps = [
    'Base Layer (0-8.33)',
    'Relationship Layer (8.33-16.67)',
    'Obligation Layer (41.67-50.00)',
    'Value Layer (47.22-50.00)'
  ];

  const validateLayer = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  };

  const handleValueChange = (layer: keyof LegalState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setConfig(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [layer]: value
      }
    }));
  };

  const renderLayerConfig = (layer: keyof LegalState, min: number, max: number, label: string) => {
    return (
      <Box sx={{ mb: 2 }}>
        <TextField
          label={label}
          type="number"
          value={config.values[layer]}
          onChange={handleValueChange(layer)}
          error={!validateLayer(config.values[layer], min, max)}
          helperText={`Value must be between ${min} and ${max}`}
          fullWidth
        />
      </Box>
    );
  };

  const renderStepContent = (step: number) => {
    switch(step) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            {renderLayerConfig('baseValue', 0, 8.33, 'Base Layer Value')}
            <PartyStatusConfig 
              config={config.partyStatus}
              onChange={(partyStatus) => setConfig(prev => ({...prev, partyStatus}))}
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ p: 3 }}>
            {renderLayerConfig('relationshipValue', 8.33, 16.67, 'Relationship Layer Value')}
            <JurisdictionConfig
              value={config.jurisdictionCode}
              onChange={(value) => setConfig(prev => ({...prev, jurisdictionCode: value}))}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ p: 3 }}>
            {renderLayerConfig('obligationValue', 41.67, 50.00, 'Obligation Layer Value')}
            <ConsiderationConfig
              value={config.considerationValue}
              onChange={(value) => setConfig(prev => ({...prev, considerationValue: value}))}
            />
          </Box>
        );
      case 3:
        return (
          <Box sx={{ p: 3 }}>
            {renderLayerConfig('valueLayerValue', 47.22, 50.00, 'Value Layer Value')}
            <AdequacyConfig
              value={config.adequacyMeasure}
              onChange={(value) => setConfig(prev => ({...prev, adequacyMeasure: value}))}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Card sx={{ maxWidth: 1200, margin: 'auto', mt: 4 }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Universal Legal Framework Configuration
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button 
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
          >
            Back
          </Button>
          <Button 
            variant="contained"
            onClick={() => setActiveStep(prev => prev + 1)}
            disabled={activeStep === steps.length}
          >
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>

        <LegalFrameworkPreview config={config} />
      </Box>
    </Card>
  );
};
