// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;


import {CairoLib} from "kakarot-lib/CairoLib.sol";

using CairoLib for uint256;

contract NamespaceNostr {

    /// @dev The address of the starknet token to call
    uint256 immutable namespaceAddress;

    /// @dev The address of the starknet token to call
    uint256 immutable kakarot;

    struct SocialRequestLink {
        uint256 public_key;
        uint64 created_at;
        uint16 kind;
        bytes tags;
        Content content;
        Signature sig;
    }
    
    struct Content {
        uint256 nostr_address;
        uint256 starknet_address;
    }
    struct Signature {
        uint256 r;
        uint256 s;
    }

    constructor(
        uint256 _kakarot,
        uint256 _namespaceAddress) {
        kakarot = _kakarot;
        namespaceAddress = _namespaceAddress;
    }


    // Get nostr address by starknet address
    function getNostrAddressByStarknetAddress(uint256 userAddress) public returns(uint256) {

        // Split amount in [low, high]
        uint128 addressLow = uint128(userAddress);
        uint128 addressHigh = uint128(userAddress >> 128);

        uint256[] memory addressOfCallData = new uint256[](2);
        addressOfCallData[0] = addressLow;
        addressOfCallData[1] = addressHigh;
        bytes memory returnData = namespaceAddress.staticcallCairo("get_nostr_by_sn_default", addressOfCallData);
        return abi.decode(returnData, (uint256));
    }


    // Get Starknet address namespace with
    function getStarknetAddressByNostrAddress(uint256 nostrAddress) public returns(uint256) {

        uint256[] memory kakarotCallData = new uint256[](1);
        kakarotCallData[0] = uint256(uint160(nostrAddress));

        uint256 userStarknetAddress =
            abi.decode(kakarot.staticcallCairo("compute_starknet_address", kakarotCallData), (uint256));
    
        uint256[] memory addressOfCallData = new uint256[](1);
        addressOfCallData[0] = userStarknetAddress;
        bytes memory returnData = namespaceAddress.staticcallCairo("get_sn_by_nostr_default", addressOfCallData);
        return abi.decode(returnData, (uint256));
    }

    function linkNostrAddress(SocialRequestLink memory request) public {

    }
    
}