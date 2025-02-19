// src/deployment/deploy.ts

import { ethers } from 'ethers';
import { loadConfig } from './config';
import { Logger } from '../services/Logger';
import path from 'path';
import fs from 'fs/promises';
import { DeploymentRecorder } from './DeploymentRecorder';
import { ContractVerifier } from './ContractVerifier';
import { DAOTokenArtifact } from './DAOTokenArtifact';

const artifactCache = new Map<string, any>();

// Load contract artifacts
const loadArtifact = async (contractName: string) => {
  // Check cache first
  if (artifactCache.has(contractName)) {
    return artifactCache.get(contractName);
  }

  const artifactPath = path.join(__dirname, '../contracts/abis', `${contractName}.json`);
  const artifactContent = await fs.readFile(artifactPath, 'utf8');
  const artifact = JSON.parse(artifactContent);
  
  // Cache the artifact
  artifactCache.set(contractName, artifact);
  return artifact;
};

export async function deploy() {
  const config = loadConfig();
  const logger = new Logger('Deployment');

  logger.info('Starting deployment process');

  try {
    // Set up provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
    const wallet = new ethers.Wallet(config.DEPLOYER_PRIVATE_KEY, provider);
    
    logger.info('Connected to network:', await provider.getNetwork());

    // Deploy contracts in sequence with retry logic
    const daoToken = await deployWithRetry(
      'DAOToken',
      wallet,
      config.RETRY_ATTEMPTS,
      config.GAS_PRICE_MULTIPLIER,
      [] // constructor args
    );

    const logicConstituent = await deployWithRetry(
      'LogicConstituent',
      wallet,
      config.RETRY_ATTEMPTS,
      config.GAS_PRICE_MULTIPLIER,
      []
    );

    const stateConstituent = await deployWithRetry(
      'StateConstituent',
      wallet,
      config.RETRY_ATTEMPTS,
      config.GAS_PRICE_MULTIPLIER,
      [daoToken.address]
    );

    const viewConstituent = await deployWithRetry(
      'ViewConstituent',
      wallet,
      config.RETRY_ATTEMPTS,
      config.GAS_PRICE_MULTIPLIER,
      []
    );

    // Save deployment information
    const deploymentData = {
      network: config.NETWORK,
      chainId: config.CHAIN_ID,
      timestamp: Date.now(),
      contracts: {
        daoToken: daoToken.address,
        logicConstituent: logicConstituent.address,
        stateConstituent: stateConstituent.address,
        viewConstituent: viewConstituent.address,
      },
      deployedBy: wallet.address
    };

    await saveDeployment(deploymentData);
    logger.info('Deployment completed successfully');

    return {
      daoToken,
      logicConstituent,
      stateConstituent,
      viewConstituent
    };

  } catch (err) {
    if (err instanceof Error) {
      logger.error('Deployment failed:', err);
    } else {
      logger.error('Deployment failed with unknown error');
    }
    throw err;
  }
}

async function saveDeployment(data: {
  network: string;
  chainId: number;
  timestamp: number;
  contracts: Record<string, string>;
  deployedBy: string;
}) {
  const deploymentPath = path.join(__dirname, '../deployments', `${data.network}.json`);
  await fs.mkdir(path.dirname(deploymentPath), { recursive: true });
  await fs.writeFile(deploymentPath, JSON.stringify(data, null, 2));
}

async function deployContract(
  name: string,
  artifact: any,
  wallet: ethers.Wallet,
  args: any[]
): Promise<ethers.Contract> {
  const logger = new Logger(`Deploy${name}`);
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  logger.info(`Deploying ${name} contract`);

  const contract = await factory.deploy(...args);
  await contract.deployed();

  logger.info(`${name} deployed at:`, contract.address);
  return contract;
}

// Individual contract deployment functions with retry logic and gas optimization
async function deployDAOToken(wallet: ethers.Wallet) {
  const logger = new Logger('DAOToken');
  const config = loadConfig();
  
  logger.info('Deploying DAOToken contract');

  // Now using all required arguments in the correct order
  const deployment = await deployWithRetry(
    'DAOToken',
    wallet,
    config.RETRY_ATTEMPTS,
    config.GAS_PRICE_MULTIPLIER,
    [] // constructor arguments
  );

  logger.info('DAOToken deployed at:', deployment.address);
  return deployment;
}

// Deployment helper with retry logic
async function deployWithRetry(
  contractName: string,
  wallet: ethers.Wallet,
  attempts: number,
  gasMultiplier: number,
  constructorArgs: any[] = []
): Promise<ethers.Contract> {
  const logger = new Logger(`Deploy${contractName}`);
  const artifact = await loadArtifact(contractName);

  for (let i = 0; i < attempts; i++) {
    try {
      const factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        wallet
      );

      logger.info(`Deploying ${contractName} contract (attempt ${i + 1}/${attempts})`);

      // Get gas price and increase by multiplier
      const gasPrice = await wallet.provider.getGasPrice();
      const adjustedGasPrice = gasPrice.mul(Math.floor(gasMultiplier * 100)).div(100);

      // Deploy with optimized gas settings
      const contract = await factory.deploy(...constructorArgs, {
        gasPrice: adjustedGasPrice,
        // Add 20% buffer to estimated gas limit
        gasLimit: (await factory.signer.estimateGas(
          factory.getDeployTransaction(...constructorArgs)
        )).mul(120).div(100)
      });

      await contract.deployed();
      logger.info(`${contractName} deployed at:`, contract.address);
      return contract;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (i === attempts - 1) {
        logger.error(`Final deployment attempt failed: ${errorMessage}`);
        throw new Error(`Failed to deploy ${contractName}: ${errorMessage}`);
      }
      logger.warn(`Deployment attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw new Error(`Failed to deploy ${contractName} after ${attempts} attempts`);
}
