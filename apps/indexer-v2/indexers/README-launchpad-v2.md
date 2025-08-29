# Launchpad V2 Indexer

This is a comprehensive Apibara V2 indexer for the AFK Launchpad that handles all major launchpad events and actions.

## Features

The indexer handles the following events:

1. **CreateToken** - When a new token is deployed
2. **CreateLaunch** - When a token launch is created
3. **BuyToken** - When someone buys tokens
4. **SellToken** - When someone sells tokens
5. **TokenClaimed** - When tokens are claimed by users
6. **LiquidityCreated** - When liquidity is created (represents graduation)
7. **LiquidityCanBeAdded** - When liquidity can be added to the pool
8. **CreatorFeeDistributed** - When creator fees are distributed
9. **MetadataCoinAdded** - When metadata is added to a token

## Database Schema

The indexer uses the existing database schema from `indexer-v2-db`:

- `token_deploy` - Token deployment records
- `token_launch` - Token launch records
- `token_metadata` - Token metadata records
- `token_transactions` - All transaction records (buy, sell, claim, etc.)
- `shares_token_user` - User token holdings and statistics

## Configuration

The indexer is configured to listen to events from the launchpad contract at:
`0x57ccd649f0df9ca80debb4bd7946bb6267785c74998f4de94514f70a8f691a3`

## Event Processing

### CreateToken Event
- Creates a new token deployment record
- Stores token name, symbol, initial supply, and total supply
- Marks token as not launched initially

### CreateLaunch Event
- Creates a launch record for the token
- Links to the token deployment record
- Updates the token deployment to mark as launched
- Stores launch parameters like threshold liquidity, bonding type, etc.

### BuyToken Event
- Updates launch record with new supply and liquidity calculations
- Creates or updates shareholder records
- Records the buy transaction
- Calculates new price and market cap

### SellToken Event
- Updates launch record with reduced supply and liquidity
- Updates shareholder records
- Records the sell transaction
- Recalculates price and market cap

### TokenClaimed Event
- Updates shareholder records to reduce claimed amounts
- Records the claim transaction
- Updates claimable status

### LiquidityCreated Event
- Marks the launch as having liquidity added
- Updates final price and market cap
- Records the liquidity creation transaction
- Represents the "graduation" of the token

### LiquidityCanBeAdded Event
- Marks the launch as ready for liquidity addition
- Records the event transaction

### CreatorFeeDistributed Event
- Records when creator fees are distributed
- Creates a transaction record for tracking

### MetadataCoinAdded Event
- Stores token metadata (URL, social links, etc.)
- Updates both deploy and launch records with name/symbol if provided

## Usage

To use this indexer:

1. Ensure the database schema is properly set up
2. Configure the indexer in your Apibara configuration
3. Set the appropriate starting block and cursor
4. Run the indexer

## Dependencies

- `@apibara/indexer`
- `@apibara/plugin-drizzle`
- `@apibara/starknet`
- `starknet` (for encoding and hashing)
- `viem` (for token amount formatting)
- `drizzle-orm` (for database operations)
- `indexer-v2-db` (for database schema)

## Error Handling

The indexer includes comprehensive error handling:
- Duplicate record detection and skipping
- Database error logging and recovery
- Event processing error isolation
- Graceful degradation when individual events fail

## Transaction Types

The indexer creates transactions with the following types:
- `buy` - Token purchases
- `sell` - Token sales
- `claim` - Token claims
- `liquidity_created` - Liquidity creation
- `liquidity_can_be_added` - Liquidity availability
- `creator_fee_distributed` - Creator fee distribution

## Notes

- All amounts are formatted using 18 decimal places by default
- The indexer handles both existing and new launch records
- Shareholder records are automatically created/updated for buy/sell operations
- Price and market cap calculations are performed automatically
- The indexer is designed to be idempotent and handle restarts gracefully

