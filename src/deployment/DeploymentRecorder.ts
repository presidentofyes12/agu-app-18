// src/deployment/DeploymentRecorder.ts
import fs from 'fs/promises';
import path from 'path';
import { ethers } from 'ethers';
import { Logger } from '../services/Logger';

export interface DeploymentRecord {
  network: string;
  chainId: number;
  timestamp: number;
  contracts: Record<string, string>;
  deployedBy: string;
  deploymentHash?: string;
  constructorArgs?: Record<string, any[]>;
}

export class DeploymentRecorder {
  private readonly logger: Logger;
  private readonly deploymentDir: string;

  constructor(deploymentDir: string = path.join(__dirname, '../deployments')) {
    this.deploymentDir = deploymentDir;
    this.logger = new Logger('DeploymentRecorder');
  }

  async recordDeployment(record: DeploymentRecord): Promise<void> {
    try {
      await fs.mkdir(this.deploymentDir, { recursive: true });
      const filename = `${record.network}-${record.chainId}-${record.timestamp}.json`;
      const filepath = path.join(this.deploymentDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(record, null, 2));
      this.logger.info(`Deployment recorded to ${filename}`);
    } catch (error) {
      // Safely type check and format the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to record deployment: ${errorMessage}`);
      throw new Error(`Deployment recording failed: ${errorMessage}`);
    }
  }

  async getLatestDeployment(network: string): Promise<DeploymentRecord | null> {
    try {
      const files = await fs.readdir(this.deploymentDir);
      const deploymentFiles = files.filter(f => f.startsWith(network) && f.endsWith('.json'));
      
      if (deploymentFiles.length === 0) return null;
      
      deploymentFiles.sort().reverse();
      
      const latestFile = path.join(this.deploymentDir, deploymentFiles[0]);
      const content = await fs.readFile(latestFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // Safely type check and format the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get latest deployment: ${errorMessage}`);
      return null;
    }
  }
}
