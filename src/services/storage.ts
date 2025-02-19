// src/services/storage.ts
import { ethers } from 'ethers';

export class StateStorage {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  public async setState(state: any): Promise<void> {
    try {
      const serializedState = JSON.stringify(state, (key, value) => {
        // Handle BigNumber serialization
        if (value && value._isBigNumber) {
          return {
            type: 'BigNumber',
            hex: value.toHexString()
          };
        }
        // Handle Map serialization
        if (value instanceof Map) {
          return {
            type: 'Map',
            value: Array.from(value.entries())
          };
        }
        return value;
      });

      localStorage.setItem(`${this.prefix}:state`, serializedState);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  public getState(): any {
    try {
      const serializedState = localStorage.getItem(`${this.prefix}:state`);
      if (!serializedState) return null;

      return JSON.parse(serializedState, (key, value) => {
        // Handle BigNumber deserialization
        if (value && value.type === 'BigNumber') {
          return ethers.BigNumber.from(value.hex);
        }
        // Handle Map deserialization
        if (value && value.type === 'Map') {
          return new Map(value.value);
        }
        return value;
      });
    } catch (error) {
      console.error('Error loading state:', error);
      return null;
    }
  }
}
