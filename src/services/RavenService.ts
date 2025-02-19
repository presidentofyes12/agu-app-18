// RavenService.ts
import { Kind } from 'nostr-tools';
import { plateformProposalKey } from 'util/constant';

enum RavenEvents {
  Ready = 'ready',
  ProposalCreated = 'proposal_created',
  ProposalUpdated = 'proposal_updated'
}

type EventHandlerMap = {
  [RavenEvents.Ready]: () => void;
  [RavenEvents.ProposalCreated]: (proposal: RavenProposal) => void;
  [RavenEvents.ProposalUpdated]: (proposal: RavenProposal) => void;
};

export interface RavenMessage {
  id: string;
  content: string;
  timestamp: number;
  type: 'VOTE_FOR' | 'VOTE_AGAINST' | 'COMMENT';
}

export interface RavenProposal {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  category?: number;
  isPermanent?: boolean;
}

export class RavenService {
  private static instance: RavenService;
  private raven?: any;

  private constructor(raven?: any) {
    this.raven = raven;
  }

  static setInstance(raven?: any): RavenService {
    if (!RavenService.instance) {
      RavenService.instance = new RavenService(raven);
    } else if (raven) {
      RavenService.instance.raven = raven;
    }
    return RavenService.instance;
  }

  static getInstance(): RavenService {
    if (!RavenService.instance) {
      throw new Error('RavenService not initialized - call setInstance first');
    }
    return RavenService.instance;
  }

  public getRavenInstance(): any {
    if (!this.raven) throw new Error('Raven not initialized');
    return this.raven;
  }

  async postProposal(proposalData: {
    title: string;
    description: string;
    category: number;
    startEpoch: string;
    endEpoch: string;
    creator: string;
  }): Promise<string> {
    if (!this.raven) throw new Error('Raven not initialized');

    const event = await this.raven.createProposal({
      id: '', // Will be set by Nostr
      name: proposalData.title,
      about: proposalData.description,
      picture: '',
      creator: proposalData.creator,
      created: Math.floor(Date.now() / 1000),
      content: proposalData.description,
      pubkey: proposalData.creator,
      created_at: Math.floor(Date.now() / 1000),
      category: proposalData.category
    });

    // Subscribe to updates for this proposal
    await this.raven.listen([event.id], Math.floor(Date.now() / 1000));

    return event.id;
  }

  async createChannel(metadata: any): Promise<void> {
    if (!this.raven) throw new Error('Raven not initialized');
    return this.raven.createChannel(metadata);
  }

  async fetchAllProposal(): Promise<RavenProposal[]> {
    if (!this.raven) throw new Error('Raven not initialized');
    
    // Get all proposals from Nostr using the same filter as in raven.ts
    const filters = [{
      kinds: [Kind.ChannelMetadata],
      '#p': [plateformProposalKey],
    }];
    
    const events = await this.raven.fetch(filters);
    
    // Subscribe to updates for all proposals
    const proposalIds = events.map((event: { id: string }) => event.id);
    if (proposalIds.length > 0) {
      // Use the same listen method as in raven.ts
      await this.raven.listen(proposalIds, Math.floor(Date.now() / 1000));
    }
    
    return events.map((event: {
      id: string;
      content: string;
      created_at: number;
      pubkey: string;
      tags: [string, string][];
    }) => ({
      id: event.id,
      content: event.content,
      created_at: event.created_at,
      pubkey: event.pubkey,
      category: parseInt(event.tags.find(t => t[0] === 'category')?.[1] || '0'),
      isPermanent: event.tags.find(t => t[0] === 'permanent')?.[1] === 'true'
    }));
  }

  async findChannel(id: string): Promise<any> {
    if (!this.raven) throw new Error('Raven not initialized');
    return this.raven.fetchChannel(id);
  }

  async sendDirectMessage(channelId: string, content: string): Promise<void> {
    if (!this.raven) throw new Error('Raven not initialized');
    return this.raven.sendDirectMessage(channelId, content);
  }

  async getChannelMessages(channelId: string): Promise<RavenMessage[]> {
    if (!this.raven) throw new Error('Raven not initialized');
    const events = await this.raven.getChannelMessages(channelId);
    return events.map((event: any) => ({
      id: event.id,
      content: event.content,
      timestamp: event.created_at,
      type: 'COMMENT'
    }));
  }

  async updateReadMarkMap(map: Record<string, number>): Promise<void> {
    if (!this.raven) throw new Error('Raven not initialized');
    return this.raven.updateReadMarkMap(map);
  }

  async checkConnectionStatus(): Promise<{
    connected: boolean;
    relays: string[];
    writeRelays: string[];
    readRelays: string[];
  }> {
    if (!this.raven) throw new Error('Raven not initialized');
    
    const writeRelays = this.raven.writeRelays || [];
    const readRelays = this.raven.readRelays || [];
    
    return {
      connected: writeRelays.length > 0 && readRelays.length > 0,
      relays: [...writeRelays, ...readRelays],
      writeRelays,
      readRelays
    };
  }

  async createTextNote(content: string, tags: string[][]): Promise<any> {
    if (!this.raven) throw new Error('Raven not initialized');
    return this.raven.publish(Kind.Text, tags, content);
  }
}