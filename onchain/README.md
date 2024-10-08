# Build On Kakarot

## Description

An example repository to demonstrate how to build on Kakarot.

## Requirements

- [Docker](https://docs.docker.com/get-docker/)
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Scarb](https://docs.swmansion.com/scarb/download.html#install-via-asdf) and [Starkli](https://github.com/xJonathanLEI/starkli) if you want to deploy Cairo contracts. Make sure to install starkli version `0.2.9` with `starkliup -v  v0.2.9`

## Setting up

Run the following command to setup the git submodules.

```
make setup
```

```
git submodule add https://github.com/kkrt-labs/kakarot-rpc lib/kakarot-rpc

git submodule add https://github.com/kkrt-labs/kakarot-lib solidity_contracts/lib/kakarot-lib

git submodule add https://github.com/foundry-rs/forge-std solidity_contracts/lib/forge-std

git submodule add https://github.com/Uniswap/v2-core solidity_contracts/lib/uniswap-v2-core

git submodule add https://github.com/Uniswap/v2-periphery solidity_contracts/lib/uniswap-v2-periphery

pnpm i .  && cp .env.example .env
```

To get started, you will need to run the local nodes. You can do this by running:

```sh
make start
```

This will start an Anvil Node (that runs the L1 contracts for L1 <> L2 messaging) at address `http://127.0.0.1:8545` and a Kakarot Node at address `http://127.0.0.1:3030`

Kakarot is deployed along with commonly used contracts, such as [Multicall3](https://github.com/mds1/multicall/blob/main/src/Multicall3.sol), [CreateX](https://github.com/pcaversaccio/createx?tab=readme-ov-file#permissioned-deploy-protection-and-cross-chain-redeploy-protection) and the [Arachnid Proxy](https://github.com/Arachnid/deterministic-deployment-proxy).

## Deploying the L1 messaging contracts

To deploy the L1 messaging contracts, you can run:

```sh
make deploy-l1
```

This will deploy the L1 messaging contracts on the Anvil node.

## Examples

### Deploying an EVM contract

You can deploy contracts on Kakarot using the regular EVM tooling, without any modifications. For example, this is how you would deploy a simple Counter contract:

```sh
export PRIVATE_KEY = <your_private_key>
export ETH_RPC_URL=http://127.0.0.1:3030
forge create solidity_contracts/src/examples/Counter.sol:Counter --private-key $PRIVATE_KEY
```

This will deploy the Counter contract on Kakarot and return the address of the deployed contract.

You can then interact with the contract using `cast`.

- Increment the counter

```sh
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "increment()" --private-key $PRIVATE_KEY
```

- Check the current counter value:

```
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "number()"
```

### Kakarot Cairo Interoperability

As Kakarot is an EVM-L2 using the Starknet Stack, you can natively interact with Cairo contracts from the EVM. This opens up a world of possibilities complex and resource-intensive applications on Kakarot, while benefiting from the performance of the cheapest zkVM, Cairo.

### Deploying a Cairo Contract

Once scarb is installed in version `2.6.5`, `cd` into the `cairo` directory and build the `Counter` cairo contract:

```
cd cairo && scarb build && ../
```

Once built, you can deploy the contract using the `starkli`. First, set an account up (using the default Katana private key, no password):

```
export STARKNET_KEYSTORE="katana.key.json"
export STARKNET_ACCOUNT="katana.account.json"
export STARKNET_RPC="http://127.0.0.1:5050"
starkli declare cairo/target/dev/afk_Counter.contract_class.json
```

This will output the contract's class hash. You can use this hash to deploy the contract:

```
starkli deploy 0x0358920a52bd68242bcef41f40531dac7243c8f0e308ebfb440d269cf063ad92 --salt 1
```

This will give you the _starknet_ address of the deployed Counter contract. You can interact with it using the `starkli` tool.

```
starkli invoke 0x01bdce28ce9c2a69e36a89a1c6cb2a927847a8991f9deda62086fb79f51955a0 increment
starkli call 0x01bdce28ce9c2a69e36a89a1c6cb2a927847a8991f9deda62086fb79f51955a0 number
```

### Interacting with the Cairo Counter from Solidity

The `CairoCounterCaller.sol` contract demonstrates how one can interact with the Cairo Counter contract from Solidity. The Cairo Counter is deployed on the "Starknet side" of Kakarot and can be interacted with from the "EVM side" of Kakarot.

Let's deploy the `CairoCounterCaller` contract, providing as constructor argument the _starknet_ address of the deployed Cairo Counter contract:

> ⚠️ Don't forget to update the commands with your actual values

```sh
forge create solidity_contracts/src/examples/CairoCounterCaller.sol:CairoCounterCaller --constructor-args 0x01bdce28ce9c2a69e36a89a1c6cb2a927847a8991f9deda62086fb79f51955a0 --private-key $PRIVATE_KEY
```

This will deploy a solidity contract, on Kakarot, that is able to interact with the Cairo Counter contract. However, before that, we need to _whitelist_ this contract to authorize it to call arbitrary contracts on the Starknet side.

```sh
make whitelist-contract CONTRACT_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
```

You can then interact with the `CairoCounterCaller` contract using `cast`. By calling `incrementCairoCounter()`, the contract will call the Cairo Counter contract to increment the counter.

```sh
cast send 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 "setCairoNumber(uint256 newNumber)" 10 --private-key $PRIVATE_KEY
```

We can then verify the counter value by calling `getCairoNumber()` on the solidity contract, or `number` on the Cairo contract.:

```sh
cast call 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9  "getCairoNumber()"
> 0x000000000000000000000000000000000000000000000000000000000000000a
```

## Deploying a dual-VM token

The `DualVMToken` contract demonstrates how one can deploy a token that is able to interact with both the EVM and Cairo contracts. The token is deployed on the Cairo side and can be interacted with from the EVM side.

Let's deploy the `DualVMToken` Cairo contract:

```sh
starkli declare cairo/target/dev/afk_DualVMToken.contract_class.json
starkli deploy 0x007cadcf5c04b02dae809a2700b85ff87aca8a3117e67e9aec24c5513730b1c1 100 0 0xb3ff441a68610b30fd5e2abbf3a1548eb6ba6f3559f2862bf2dc757e5828ca --salt 1
```

This will deploy a token contract on the Cairo side. You can interact with it using the `starkli` tool.

```sh
starkli call 0x015c370e6ad1799fc94b61982b72f2507bb88d0fc788153f7b052e55f7ea59bf "balance_of" 0xb3ff441a68610b30fd5e2abbf3a1548eb6ba6f3559f2862bf2dc757e5828ca
[
    "0x0000000000000000000000000000000000000000000000000000000000000064",
    "0x0000000000000000000000000000000000000000000000000000000000000000"
]
```

Now, let's build the EVM contract that will enable interactions with this token from the EVM side.

```sh
make copy-env
KAKAROT_ADDRESS=$(grep KAKAROT_ADDRESS .env | cut -d '=' -f2)
forge create solidity_contracts/src/examples/DualVMToken.sol:DualVMToken --constructor-args $KAKAROT_ADDRESS 0x015c370e6ad1799fc94b61982b72f2507bb88d0fc788153f7b052e55f7ea59bf --private-key $PRIVATE_KEY
```

Don't forget to whitelist the contract to authorize it to call arbitrary contracts on the Starknet side.

```sh
make whitelist-contract CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

You can now interact with the `DualVMToken` contract using `cast`. By calling `name()`, the contract will call the Cairo token contract to get the token name. When transferring tokens, the contract will resolve the Starknet addresses of the EVM accounts, and perform the transfer on the Cairo side. This is entirely transparent, and the user does not need to know about what happens under the hood: it acts as a regular ERC20.

```sh
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "name()"
```

### Run tests

To run the hardhat test suite, you can run:

```sh
make test
```

To run test without build cairo contracts again

```sh
make test-speed
```
