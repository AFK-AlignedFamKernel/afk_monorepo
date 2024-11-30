# Launchpad


Launchpad contract is a Fair launch to create your coin on Starknet, 
launch a bonding curve fair launch, or add liquidity safely and unruggable for your community.

## What you can do:

- Create token with supply choosen
- Launch token bonding curve
- Add Unrug Liquidity to DEX
a. Ekubo (done)
b. Jediswap (WIP)

# Files scope
launchpad.cairo : (WIP refacto into few components reusable)
calcul.cairo
memecoin.cairo & memecoin_v2.cairo soon

# Specs

Contract in launchpad.cairo
Bonding curve located in calcul.cairo
System call of memecoin.cairo, soon memecoin_v2.cairo (OZ, Vote).
Interaction with Ekubo, Jediswap