import { Event, getEventHash, getPublicKey, signEvent } from 'nostr-tools';

export interface NostrConfig {
  relays: string[];
  privateKey?: string;
}

export class NostrService {
  private relays: string[];
  private privateKey?: string;

  constructor(config: NostrConfig) {
    this.relays = config.relays;
    this.privateKey = config.privateKey;
  }

  async createProposalPost(proposal: {
    title: string;
    description: string;
    category: number;
    votingPeriod: number;
    chainId?: string;
    transactionHash?: string;
  }): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key required for posting');
    }

    const eventData = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'proposal'],
        ['category', proposal.category.toString()],
        ['voting_period', proposal.votingPeriod.toString()],
      ],
      content: JSON.stringify({
        title: proposal.title,
        description: proposal.description,
        chainId: proposal.chainId,
        transactionHash: proposal.transactionHash,
      }),
      pubkey: getPublicKey(this.privateKey),
    };

    const event: Event = {
      ...eventData,
      id: '',
      sig: ''
    };

    if (proposal.chainId && proposal.transactionHash) {
      event.tags.push(['chain', proposal.chainId]);
      event.tags.push(['tx', proposal.transactionHash]);
    }

    event.id = getEventHash(event);
    event.sig = signEvent(event, this.privateKey);

    // Publish to all configured relays
    const publishPromises = this.relays.map(relay => this.publishToRelay(relay, event));
    await Promise.all(publishPromises);

    return event.id;
  }

  async batchPostProposals(proposals: Array<{
    title: string;
    description: string;
    category: number;
    votingPeriod: number;
    chainId?: string;
    transactionHash?: string;
  }>): Promise<string[]> {
    return Promise.all(proposals.map(proposal => this.createProposalPost(proposal)));
  }

  async createChatMessage(content: string, teamId: string, replyTo?: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key required for posting');
    }

    const eventData = {
      kind: 42,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'team_chat'],
        ['team', teamId],
      ],
      content,
      pubkey: getPublicKey(this.privateKey),
    };

    const event: Event = {
      ...eventData,
      id: '',
      sig: ''
    };

    if (replyTo) {
      event.tags.push(['e', replyTo]);
    }

    event.id = getEventHash(event);
    event.sig = signEvent(event, this.privateKey);

    const publishPromises = this.relays.map(relay => this.publishToRelay(relay, event));
    await Promise.all(publishPromises);

    return event.id;
  }

  private async publishToRelay(relay: string, event: Event): Promise<void> {
    const ws = new WebSocket(relay);
    
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.send(JSON.stringify(['EVENT', event]));
      };

      ws.onmessage = (msg) => {
        const response = JSON.parse(msg.data);
        if (response[0] === 'OK' && response[1] === event.id) {
          ws.close();
          resolve();
        }
      };

      ws.onerror = (error) => {
        ws.close();
        reject(error);
      };
    });
  }
}