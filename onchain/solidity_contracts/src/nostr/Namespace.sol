// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {CairoLib} from "kakarot-lib/CairoLib.sol";

using CairoLib for uint256;

contract Namespace {

    /// @dev The address of the starknet token to call
    uint256 immutable namespaceAddress;

    constructor(uint256 _namespaceAddress) {
        namespaceAddress = _namespaceAddress;
    }

    // Get Nostr address by Starknet address
    function getNostrAddressByStarknetAddress(uint256 userAddress) public returns (uint256) {
        uint256;
        kakarotCallData[0] = userAddress;

        uint256 userStarknetAddress =
            abi.decode(namespaceAddress.staticcallCairo("compute_starknet_address", kakarotCallData), (uint256));
    
        uint256;
        addressOfCallData[0] = userStarknetAddress;
        bytes memory returnData = namespaceAddress.staticcallCairo("get_nostr_by_sn_default", addressOfCallData);
        
        return abi.decode(returnData, (uint256));
    }

    // Get Starknet address by Nostr address
    function getStarknetAddressByNostrAddress(uint256 nostrAddress) public returns (uint256) {
        uint256;
        kakarotCallData[0] = nostrAddress;

        uint256 userStarknetAddress =
            abi.decode(namespaceAddress.staticcallCairo("compute_starknet_address", kakarotCallData), (uint256));
    
        uint256;
        addressOfCallData[0] = userStarknetAddress;
        bytes memory returnData = namespaceAddress.staticcallCairo("get_sn_by_nostr_default", addressOfCallData);
        
        return abi.decode(returnData, (uint256));
    }

    // Link Nostr address
    function linkNostrAddress(uint256 nostrAddress, uint256 starknetAddress) public {
        uint256;
        kakarotCallData[0] = nostrAddress;
        kakarotCallData[1] = starknetAddress;

        // Call the Cairo method to link Nostr address
        namespaceAddress.staticcallCairo("linked_nostr_default_account", kakarotCallData);
    }
}
