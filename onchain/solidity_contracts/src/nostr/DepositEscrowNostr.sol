// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {CairoLib} from "kakarot-lib/CairoLib.sol";

using CairoLib for uint256;

contract DepositEscrowNostr {

    /// @dev The address of the starknet token to call
    uint256 immutable depositAddress;

    /// @dev The address of the starknet token to call
    uint256 immutable kakarot;

    mapping (address => uint) name;
    mapping (address => Deposit) depositUsers;


    struct SocialRequestClaim {
        uint256 public_key;
        uint64 created_at;
        uint16 kind;
        bytes tags;
        Content content;
        Signature sig;
    }
    
    struct Content {
        bytes31 deposit_id;
        uint256 starknet_recipient;
        uint256 gas_token_address;
        uint256 gas_amount;
    }
    struct Signature {
        uint256 r;
        uint256 s;
    }


    struct Deposit {
        uint256 deposit;
        uint256 withdraw;
        uint256 nostrAddress;
        address owner;
    }

    constructor(uint256 _kakarot,
        uint256 _depositAddress) {
            kakarot = _kakarot;
            depositAddress = _depositAddress;
    }

    function depositTo(
        uint256 amount,
        address tokenAddress,
        uint256 nostrAddress,
        uint64 timelock) public returns(uint256) {

        // Get token address
        uint256[] memory kakarotCallData = new uint256[](1);
        kakarotCallData[0] = uint256(uint160(tokenAddress));

        uint256 tokenStarknetAddress =
            abi.decode(kakarot.staticcallCairo("compute_starknet_address", kakarotCallData), (uint256));

        // // Split amount in [low, high]
        uint128 amountLow = uint128(amount);
        uint128 amountHigh = uint128(amount >> 128);

                // Split amount in [low, high]
        uint128 nostrAddressLow = uint128(nostrAddress);
        uint128 nostrAddressHigh = uint128(nostrAddress >> 128);

        uint256[] memory depositCallData = new uint256[](6);
        depositCallData[0] = amountLow;
        depositCallData[1] = amountHigh;
        depositCallData[2] = tokenStarknetAddress;
        depositCallData[3] = uint(nostrAddressLow);
        depositCallData[4] = uint(nostrAddressHigh);
        depositCallData[5] = uint(timelock);
        bytes memory returnData = depositAddress.staticcallCairo("deposit", depositCallData);
        return abi.decode(returnData, (uint256));
        // return tokenStarknetAddress;


    }

    function claim(SocialRequestClaim memory request) public {
        
    }

    
}