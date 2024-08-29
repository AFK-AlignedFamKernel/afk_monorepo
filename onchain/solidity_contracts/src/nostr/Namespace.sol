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


    // Get nostr address by starknet address
    function getNostrAddressByStarknetAddress(uint256 userAddress) public {

        uint256[] memory kakarotCallData = new uint256[](1);
        kakarotCallData[0] = uint256(uint160(userAddress));

        uint256 userStarknetAddress =
            abi.decode(namespaceAddress.staticcallCairo("compute_starknet_address", kakarotCallData), (uint256));
    
        uint256[] memory addressOfCallData = new uint256[](1);
        addressOfCallData[0] = userStarknetAddress;
        bytes memory returnData = namespaceAddress.staticcallCairo("get_nostr_by_sn_default", addressOfCallData);
        // return abi.decode(returnData, (uint256));
    }


    // Get Starknet address namespace with
    function getStarknetAddressByNostrAddress(uint256 nostrAddress) public {

        uint256[] memory kakarotCallData = new uint256[](1);
        kakarotCallData[0] = uint256(uint160(nostrAddress));

        uint256 userStarknetAddress =
            abi.decode(namespaceAddress.staticcallCairo("compute_starknet_address", kakarotCallData), (uint256));
    
        uint256[] memory addressOfCallData = new uint256[](1);
        addressOfCallData[0] = userStarknetAddress;
        bytes memory returnData = namespaceAddress.staticcallCairo("get_sn_by_nostr_default", addressOfCallData);
        // return abi.decode(returnData, (uint256));
    }

    function linkNostrAddress() public {

    }
    
}