// types/authority.ts
export enum VotingCapabilityType {
  CREATE_PROPOSAL = 'CREATE_PROPOSAL',
  EMERGENCY_VOTE = 'EMERGENCY_VOTE',
  STANDARD_VOTE = 'STANDARD_VOTE'
}

export type AuthorityStateResponse = {
  level: number;
  capabilities: VotingCapabilityType[];
  toFixed: (decimals: number) => string;
};
