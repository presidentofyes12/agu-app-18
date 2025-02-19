// src/views/components/settings/LegalDAOSettings.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardContent,
  Tabs, Tab, Box, TextField,
  Switch, FormControlLabel, Button,
  Accordion, AccordionSummary, AccordionDetails,
  Typography, Chip, Autocomplete,
  Dialog, DialogTitle, DialogContent,
  DialogActions
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useAtom } from 'jotai';
import { atomWithImmer } from 'jotai/immer';
import type { SetStateAction } from 'react';
import { LEGAL_CONCEPTS, LegalConceptUtils, type LegalConceptKey } from '../../../types/legalConcepts';
/*import { 
  LEGAL_CONCEPTS, 
  LegalConceptUtils, 
  type LegalConceptKey 
} from '@/types/legalConcepts';  // Using path alias*/

// Define interfaces with legal concept mappings
interface LegalDAOConfiguration {
  conceptState: LegalConceptKey;
  type: 'education' | 'alumni' | 'membership' | 'content' | 'custom';
  roles: {
    [key: string]: {
      name: string;
      legalConcept: LegalConceptKey;
      permissions: string[];
      requirements: {
        type: 'connections' | 'participation' | 'token_holding' | 'custom';
        threshold: number;
        legalState: LegalConceptKey;
      };
    };
  };
  governance: {
    votingSystem: {
      conceptState: LegalConceptKey;
      threshold: number;
      timelock: number;
    };
    treasury: {
      conceptState: LegalConceptKey;
      controllers: string[];
    };
  };
  accessControl: {
    conceptState: LegalConceptKey;
    whitelist: {
      enabled: boolean;
      addresses: string[];
      legalState: LegalConceptKey;
    };
  };
  namingConvention: {
    conceptState: LegalConceptKey;
    enabled: boolean;
    format: string;
    separator: string;
    validationState: LegalConceptKey;
  };
}

// First, we'll create a default configuration object
const defaultConfig: LegalDAOConfiguration = {
  conceptState: 'LEGAL_GROUND_ZERO' as LegalConceptKey,
  type: 'custom',
  roles: {},
  governance: {
    votingSystem: {
      conceptState: 'PRIMARY_RIGHT' as LegalConceptKey,
      threshold: 51,
      timelock: 24
    },
    treasury: {
      conceptState: 'FIRST_POWER_STATE' as LegalConceptKey,
      controllers: []
    }
  },
  accessControl: {
    conceptState: 'FIRST_AUTHORITY' as LegalConceptKey,
    whitelist: {
      enabled: false,
      addresses: [],
      legalState: 'SECOND_AUTHORITY' as LegalConceptKey
    }
  },
  namingConvention: {
    conceptState: 'FIRST_DOMAIN' as LegalConceptKey,
    enabled: false,
    format: '',
    separator: 'ø',
    validationState: 'SECOND_DOMAIN' as LegalConceptKey
  }
};

// Create the atom with proper typing
const legalDAOConfigAtom = atomWithImmer<LegalDAOConfiguration>(defaultConfig);

const LegalDAOSettings: React.FC = () => {
  // Use type assertion for proper typing
  const [config, setConfig] = useAtom(legalDAOConfigAtom) as [
    LegalDAOConfiguration,
    (update: SetStateAction<LegalDAOConfiguration>) => void
  ];
  const [currentTab, setCurrentTab] = useState(0);
  const [conceptValidation, setConceptValidation] = useState<{
    isValid: boolean;
    message?: string;
  }>({ isValid: true });

  // Role configuration modal state
  const [isRoleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<{
    name: string;
    concept: LegalConceptKey;
  }>({ name: '', concept: 'PRIMARY_VOID' as LegalConceptKey });

  // Validate legal concept relationships
  useEffect(() => {
    const validateConfiguration = () => {
      // Validate hierarchy of concepts
      const mainConceptValue = LegalConceptUtils.getConceptValue(config.conceptState);
      const votingConceptValue = LegalConceptUtils.getConceptValue(config.governance.votingSystem.conceptState);
      const treasuryConceptValue = LegalConceptUtils.getConceptValue(config.governance.treasury.conceptState);

      if (!mainConceptValue || !votingConceptValue || !treasuryConceptValue) {
        setConceptValidation({
          isValid: false,
          message: 'Invalid concept configuration detected'
        });
        return;
      }

      if (votingConceptValue > mainConceptValue || treasuryConceptValue > mainConceptValue) {
        setConceptValidation({
          isValid: false,
          message: 'Subsidiary concepts cannot exceed main DAO concept level'
        });
        return;
      }

      setConceptValidation({ isValid: true });
    };

    validateConfiguration();
  }, [config]);

  // Template configurations for different DAO types with legal concepts
  const daoTemplates: Record<string, Partial<LegalDAOConfiguration>> = {
    education: {
      conceptState: 'FIRST_AUTHORITY' as LegalConceptKey,
      roles: {
        board: {
          name: 'Board Member',
          legalConcept: 'SECOND_AUTHORITY' as LegalConceptKey,
          permissions: ['approve_payments', 'modify_settings'],
          requirements: {
            type: 'custom',
            threshold: 0,
            legalState: 'THIRD_AUTHORITY' as LegalConceptKey
          }
        },
        teacher: {
          name: 'Teacher',
          legalConcept: 'FIRST_DOMAIN' as LegalConceptKey,
          permissions: ['submit_payment_requests', 'create_content'],
          requirements: {
            type: 'custom',
            threshold: 0,
            legalState: 'SECOND_DOMAIN' as LegalConceptKey
          }
        }
      }
    }
  };

  // Create a type-safe update helper
  const updateConfig = (updater: (config: LegalDAOConfiguration) => void) => {
    setConfig((prev) => {
      const next = { ...prev };
      updater(next);
      return next;
    });
  };

  // Update the handlers to use our type-safe update helper
  const handleTypeChange = (type: LegalDAOConfiguration['type']) => {
    const template = daoTemplates[type] || {};
    updateConfig((draft) => {
      Object.assign(draft, {
        ...draft,
        type,
        ...template
      });
    });
  };

  const handleConceptChange = (_: unknown, value: LegalConceptKey | null) => {
    if (value) {
      updateConfig((draft) => {
        draft.conceptState = value;
      });
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Legal DAO Configuration" 
        subheader={`Current State: ${LEGAL_CONCEPTS[config.conceptState].name}`}
      />
      <CardContent>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
          <Tab label="General Configuration" />
          <Tab label="Roles & Permissions" />
          <Tab label="Governance" />
          <Tab label="Access Control" />
          <Tab label="Naming Convention" />
        </Tabs>

        {!conceptValidation.isValid && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error">
              {conceptValidation.message}
            </Typography>
          </Box>
        )}

        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: 2 }}>
            <Autocomplete
              options={Object.keys(LEGAL_CONCEPTS) as LegalConceptKey[]}
              value={config.conceptState}
              onChange={handleConceptChange}
              getOptionLabel={(option: LegalConceptKey) => LEGAL_CONCEPTS[option].name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="DAO Legal Concept State"
                  helperText={LEGAL_CONCEPTS[config.conceptState].description}
                />
              )}
            />
            
            <Autocomplete
              sx={{ mt: 2 }}
              options={['education', 'alumni', 'membership', 'content', 'custom'] as const}
              value={config.type}
              onChange={(_, value) => value && handleTypeChange(value)}
              renderInput={(params) => (
                <TextField {...params} label="DAO Type" />
              )}
            />
          </Box>
        </TabPanel>

        {/* Additional tab panels would follow here */}
      </CardContent>
    </Card>
  );
};

const TabPanel: React.FC<{
  children?: React.ReactNode;
  value: number;
  index: number;
}> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && children}
  </div>
);

export default LegalDAOSettings;
