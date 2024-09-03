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

    // Link Starknet to Nostr address with a NOstr event signed
    // @params Nostr event with signature 
    // and a specific struct content depending on the Link request
    function linkNostrAddress(SocialRequestLink memory request) public {

        // @TODO create the struct in assembly

        uint256[] memory data = new uint256[](12);
        // Split address in [low, high]
        uint128 addressLow = uint128(request.public_key);
        uint128 addressHigh = uint128(request.public_key >> 128);

        data[0] = uint256(addressLow);
        data[1] = uint256(addressHigh);
        data[2] = uint256(request.created_at);
        data[3] = uint256(request.kind);

        // Convert tag
        require(request.tags.length <= 32, "Data too long, must be 32 bytes or less");

        bytes memory tags= request.tags;
        uint256 result;
        assembly {
            // Load the first 32 bytes from the `data` array into `result`
            result := mload(add(tags, 32))
        }
        data[4] =result;

        // Split content in [low, high]
        uint128 nostrAddressLow = uint128(request.content.nostr_address);
        uint128 nostrAddressHigh = uint128(request.content.nostr_address >> 128);

        data[5] = uint256(nostrAddressLow);
        data[6] = uint256(nostrAddressHigh);
        uint256[] memory starknetCalldata = new uint256[](1);
        starknetCalldata[0] = uint256(uint160(request.content.starknet_address));
        uint256 starknetAddress =
            abi.decode(kakarot.staticcallCairo("compute_starknet_address", starknetCalldata), (uint256));

        data[7] = uint256(starknetAddress);

        // Split sig r in [low, high]
        uint128 sigRLow = uint128(request.sig.r);
        uint128 sigRHigh = uint128(request.sig.r >> 128);

        data[8] = uint256(sigRLow);
        data[9] = uint256(sigRHigh);

        // Split sig s in [low, high]
        uint128 sigSLow = uint128(request.sig.s);
        uint128 sigSHigh = uint128(request.sig.s >> 128);

        data[10] = uint256(sigSLow);
        data[11] = uint256(sigSHigh);

        bytes memory returnData = namespaceAddress.staticcallCairo("linked_nostr_default_account", data);

    }

    function bytesToUint256(bytes calldata b) internal pure returns (uint256) {
        require(b.length <= 32, "Byte array should be no longer than 32 bytes");
        uint256 bytesInt;
        assembly {
            bytesInt := mload(add(b.offset, 32))
        }
        return bytesInt;

    }

    
}