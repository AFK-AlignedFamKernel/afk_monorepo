# Launchpad


Launchpad contract is a Fair launch to create your coin on Starknet, 
launch a bonding curve fair launch, or add liquidity safely and unruggable for your community.

## What you can do:

- Create token with supply chosen etc
- Launch token bonding curve: Linear and Exponential
- Add liquidity after bonding curve
a. Ekubo (done)
b. Jediswap (WIP)

- Add Unrug Liquidity to DEX
a. Ekubo (WIP)
b. Jediswap (WIP)


# Files scope

launchpad.cairo : (WIP refacto into few components reusable)
launchpad_types.cairo
calcul.cairo
linear.cairo
launch.cairo
exponential.cairo
memecoin.cairo & memecoin_v2.cairo soon

# Functionnalities

Contract in launchpad.cairo
Bonding curve located in linear.cairo and exponential.cairo
System call of memecoin.cairo, soon memecoin_v2.cairo (OZ, Vote).
Interaction with Ekubo, Jediswap


# Smart Contract Documentation for Auditors

## Core Contracts Overview

### 1. Launchpad.cairo
The main contract handling token launches and liquidity management.

Key Components:
- Token creation
- Launch management
- Bonding curve management
- Buy and sell coin
- Fee handling system (protocol fee, V2 with  creator fees)
- Access control for admin functions
- Integration with DEXs (Ekubo, Jediswap planned)
- Upgradeable contract pattern

Critical Areas:
- Fee calculations and rounding
- Access control for privileged functions
- State management during launches
- Token creation parameter validation
- Price calculations during buys/sells

### 2. Linear.cairo 
Implements linear bonding curve pricing mechanism.

Key Functions:
- get_meme_amount(): Calculates tokens received when buying
- get_coin_amount(): Calculates quote tokens received when selling
- calculate_starting_price_launch(): Sets initial token price

Critical Areas:
- Precision loss in calculations
- Overflow/underflow risks
- Edge cases in price calculations
- Scaling factors (SCALE_FACTOR, DECIMAL_FACTOR)
- Square root approximations

### 3. Exponential.cairo
Implements exponential bonding curve using Taylor series approximation.

Key Functions:
- exponential_approximation(): Calculates e^x using Taylor series
- logarithm_approximation(): Natural log approximation
- get_price(): Determines token price based on supply

Critical Areas:
- Taylor series convergence and precision
- Term limit impact on accuracy
- Scaling factors for large numbers
- Gas costs with iteration
- Numerical stability

## Security Considerations

### Price Manipulation Risks
- Front-running opportunities during price changes
- Price impact on large trades
- Rounding errors accumulation
- Precision loss in math operations

### State Management 
- Race conditions during launches
- Reentrancy vulnerabilities
- Storage slot collisions
- Access control enforcement

### Economic Security
- Fee calculation accuracy
- Liquidity pool manipulation
- Token supply management
- Price oracle dependencies

### Integration Points
- DEX interaction safety
- External call handling
- Event emission consistency
- Upgrade mechanism security

## Known Edge Cases

1. Price Calculation
- Zero amount trades
- Max supply reached
- Minimum price thresholds
- Extreme price swings

2. Liquidity Management
- Initial pool setup
- Emergency withdrawals
- Fee distribution
- Reserve ratio maintenance

3. Token Operations
- Creation parameters
- Launch constraints
- Trading limitations
- Supply boundaries

## Audit Focus Areas

1. Mathematical Precision
- Verify bonding curve calculations
- Check rounding behavior
- Test boundary conditions
- Validate scaling factors

2. Access Controls
- Admin role restrictions
- Function permissions
- Upgrade controls
- Emergency functions

3. Economic Design
- Fee model sustainability
- Price manipulation resistance
- Liquidity incentives
- Market dynamics

4. Integration Security
- DEX interaction safety
- External call handling
- Event consistency
- State synchronization

5. Contract-Specific Security Considerations

### Launchpad.cairo
Key Security Points:
- Token creation validation: Ensure parameters like supply, name, symbol are properly validated
- Fee handling: Check for precision loss in fee calculations and distributions
- State management: Verify atomic operations during launches and liquidity additions
- Access control: Review admin functions and role-based permissions
- Upgrade mechanism: Assess security of upgrade pattern and potential vulnerabilities

Critical Functions:
- `create_token()`: Validates and initializes new token
- `create_token_and_launch()`: Validates and initializes new token launches and bonding curve
- `launch_token()`: Validates and initializes new token launches and bonding curve
- `buy_coin_by_quote()`: Handles token purchases via bonding curve
- `sell_coin()`: Processes token sales and quote token returns
- `_add_liquidity_ekubo()`: Manages DEX liquidity provision
- `claim_all()`: Claim all tokens after bonding curve reached
- `claim_friend()`: Claim friend for the friend tokens after bonding curve reached (automated claimed)

### Linear.cairo
Bonding Curve Implementation:

Key Security Considerations:
- Precision handling in slope/intercept calculations
- Overflow checks in price computations
- Edge cases: zero amounts, max supply
- Scaling factors for numerical stability
- Rounding behavior impact on pricing

Critical Functions:
- `get_meme_amount()`: Calculates tokens received for quote token input
- `get_coin_amount()`: Calculates quote tokens received for token sales
- `calculate_starting_price_launch()`: Sets initial token price

### Exponential.cairo
Bonding Curve Implementation:
- Uses exponential price function via Taylor series approximation
- Price increases exponentially with supply sold
- Configurable precision via TAYLOR_TERMS constant

Key Security Considerations:
- Convergence of Taylor series approximation
- Precision loss in iterative calculations
- Gas costs for term computation
- Boundary conditions and extreme values
- Numerical stability at scale

Critical Functions:
- `exponential_approximation()`: Core pricing calculation
- `logarithm_approximation()`: Inverse calculation for sales
- Term iteration and accumulation logic

Common Vulnerabilities to Check:
1. Arithmetic overflow/underflow
2. Precision loss in calculations
3. Rounding errors accumulation
4. Gas limits in iterative functions
5. Front-running opportunities
6. Price manipulation vectors
7. State inconsistency scenarios
8. Reentrancy risks in external calls


