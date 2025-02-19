// src/deployment/config.ts

import { z } from 'zod';
import dotenv from 'dotenv';

// Define configuration schema for type safety
const ConfigSchema = z.object({
  // Network configuration
  NETWORK: z.enum(['mainnet', 'testnet', 'local']),
  RPC_URL: z.string().url(),
  CHAIN_ID: z.number(),
  
  // Contract addresses
  DAO_TOKEN_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  LOGIC_CONSTITUENT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  STATE_CONSTITUENT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  VIEW_CONSTITUENT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  
  // Deployment settings
  DEPLOYER_PRIVATE_KEY: z.string().min(64).max(66),
  GAS_PRICE_MULTIPLIER: z.number().default(1.1),
  CONFIRMATION_BLOCKS: z.number().default(2),
  
  // API keys and external services
  INFURA_PROJECT_ID: z.string().optional(),
  ETHERSCAN_API_KEY: z.string().optional(),
  
  // Monitoring configuration
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  
  // Performance tuning
  CACHE_DURATION: z.number().default(5 * 60 * 1000), // 5 minutes
  BATCH_SIZE: z.number().default(100),
  RETRY_ATTEMPTS: z.number().default(3),
});

// Load and validate configuration
export function loadConfig() {
  dotenv.config();
  
  const config = {
    NETWORK: process.env.NETWORK,
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: parseInt(process.env.CHAIN_ID || '0'),
    DAO_TOKEN_ADDRESS: process.env.DAO_TOKEN_ADDRESS,
    LOGIC_CONSTITUENT_ADDRESS: process.env.LOGIC_CONSTITUENT_ADDRESS,
    STATE_CONSTITUENT_ADDRESS: process.env.STATE_CONSTITUENT_ADDRESS,
    VIEW_CONSTITUENT_ADDRESS: process.env.VIEW_CONSTITUENT_ADDRESS,
    DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
    GAS_PRICE_MULTIPLIER: parseFloat(process.env.GAS_PRICE_MULTIPLIER || '1.1'),
    CONFIRMATION_BLOCKS: parseInt(process.env.CONFIRMATION_BLOCKS || '2'),
    INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    SENTRY_DSN: process.env.SENTRY_DSN,
    CACHE_DURATION: parseInt(process.env.CACHE_DURATION || '300000'),
    BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '100'),
    RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS || '3'),
  };

  return ConfigSchema.parse(config);
}

export type Config = z.infer<typeof ConfigSchema>;
