# InfoFi Hooks

This directory contains React hooks for InfoFi functionality, including data fetching, contract interactions, and state management.

## Data Hooks

### useDataInfoMain
Main hook that combines all InfoFi data fetching.

```tsx
import { useDataInfoMain } from '@/hooks/infofi';

function MyComponent() {
  const { allData, isLoading, isError, tokens, launches } = useDataInfoMain();
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;
  
  return <div>{/* Use allData, tokens, launches */}</div>;
}
```

### useGetAllTipUser
Fetches all users who have received tips.

```tsx
import { useGetAllTipUser } from '@/hooks/infofi';

function MyComponent() {
  const { data, isLoading, isError } = useGetAllTipUser();
  
  return <div>{/* Use data */}</div>;
}
```

### useGetAllTipByUser
Fetches tips for a specific user.

```tsx
import { useGetAllTipByUser } from '@/hooks/infofi';

function MyComponent({ nostrAddress }: { nostrAddress: string }) {
  const { data, isLoading, isError } = useGetAllTipByUser(nostrAddress);
  
  return <div>{/* Use data */}</div>;
}
```

## Subscription Factory Hooks

### useScoreFactoryData
Combined hook for getting all score factory data.

```tsx
import { useScoreFactoryData } from '@/hooks/infofi';

function MyComponent({ subAddress, epochIndex }: { 
  subAddress?: string; 
  epochIndex?: string; 
}) {
  const {
    allSubs,
    subDetailsData,
    subProfiles,
    epochProfiles,
    subEpochs,
    subAggregations,
    isLoading,
    isError,
    refetch,
  } = useScoreFactoryData(subAddress, epochIndex);
  
  return <div>{/* Use data */}</div>;
}
```

### useGetAllSubs
Fetches all available subscriptions.

```tsx
import { useGetAllSubs } from '@/hooks/infofi';

function MyComponent() {
  const { data, isLoading, isError, refetch } = useGetAllSubs();
  
  return <div>{/* Use data */}</div>;
}
```

## Contract Interaction Hooks

### useNamespace
Handles namespace linking and subscription management.

```tsx
import { useNamespace } from '@/hooks/infofi';

function MyComponent() {
  const { 
    handleLinkNamespace, 
    handleLinkNamespaceFromNostrScore,
    isLinkingNamespace,
    isLinkingFromNostrScore 
  } = useNamespace();
  
  const handleSubscribe = async () => {
    try {
      await handleLinkNamespace();
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };
  
  return (
    <button 
      onClick={handleSubscribe}
      disabled={isLinkingNamespace}
    >
      {isLinkingNamespace ? 'Subscribing...' : 'Subscribe'}
    </button>
  );
}
```

### useDepositRewards
Handles depositing rewards to the InfoFi contract.

```tsx
import { useDepositRewards } from '@/hooks/infofi';

function MyComponent() {
  const { handleDepositRewards, isDepositing } = useDepositRewards();
  
  const handleDeposit = async () => {
    try {
      await handleDepositRewards({
        nostr_address: 'user_nostr_address',
        vote: 'good',
        is_upvote: true,
        upvote_amount: '100',
        downvote_amount: '0',
        amount: '100',
        amount_token: '100',
      });
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };
  
  return (
    <button 
      onClick={handleDeposit}
      disabled={isDepositing}
    >
      {isDepositing ? 'Depositing...' : 'Deposit Rewards'}
    </button>
  );
}
```

### useVoteTip
Handles voting and tipping functionality.

```tsx
import { useVoteTip } from '@/hooks/infofi';

function MyComponent() {
  const { 
    handleVoteTip, 
    handleVoteStarknetOnly,
    isVoting,
    isVotingStarknetOnly 
  } = useVoteTip();
  
  const handleTip = async () => {
    try {
      await handleVoteStarknetOnly({
        nostr_address: 'user_nostr_address',
        vote: 'good',
        is_upvote: true,
        upvote_amount: '50',
        downvote_amount: '0',
        amount: '50',
        amount_token: '50',
      });
    } catch (error) {
      console.error('Tip failed:', error);
    }
  };
  
  return (
    <button 
      onClick={handleTip}
      disabled={isVotingStarknetOnly}
    >
      {isVotingStarknetOnly ? 'Tipping...' : 'Tip User'}
    </button>
  );
}
```

## Types

### VoteParams
```tsx
interface VoteParams {
  nostr_address?: string;
  vote: string;
  is_upvote: boolean;
  upvote_amount: string;
  downvote_amount: string;
  amount: string;
  amount_token: string;
}
```

### NostrProfileInfoFiInterface
```tsx
interface NostrProfileInfoFiInterface {
  nostr_id: string;
  total_ai_score: string;
  total_vote_score: string;
  starknet_address?: string;
  is_add_by_admin?: boolean;
  epoch_states?: any[];
}
```

### InfoFiData
```tsx
interface InfoFiData {
  aggregations: AggregationsData;
  contract_states: ContractState[];
}
```

## Configuration

### Environment Variables
Set these environment variables in your `.env.local`:

```bash
NEXT_PUBLIC_INDEXER_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_PROVIDER_URL=https://starknet-sepolia.public.blastapi.io
```

### Contract Addresses
Update the contract addresses in each hook file with your actual deployed contract addresses:

- `NOSTR_FI_SCORING_ADDRESS`
- `NAMESPACE_ADDRESS`
- `TOKENS_ADDRESS`

## Error Handling

All hooks include proper error handling and will show toast notifications for success/error states using the `useUIStore`.

## Caching

Hooks use React Query for caching with a 5-minute stale time. Data will be automatically refetched when needed.

## TODO

- [ ] Implement actual contract ABIs and interactions
- [ ] Add proper error boundaries
- [ ] Add retry logic for failed requests
- [ ] Add optimistic updates
- [ ] Add real-time updates with WebSocket
- [ ] Add proper TypeScript types for all API responses
- [ ] Add unit tests for hooks
- [ ] Add integration tests 