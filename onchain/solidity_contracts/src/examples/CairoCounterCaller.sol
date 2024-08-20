// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import {CairoLib} from "kakarot-lib/CairoLib.sol";

using CairoLib for uint256;

contract CairoCounterCaller {
    /// @dev The address of the cairo contract to call
    uint256 immutable cairoCounter;

    /// @dev The cairo function selector to call - `set_counter`
    uint256 constant FUNCTION_SELECTOR_SET_NUMBER = uint256(keccak256("set_number")) % 2 ** 250;

    /// @dev The cairo function selector to call - `get`
    uint256 constant FUNCTION_SELECTOR_NUMBER = uint256(keccak256("number")) % 2 ** 250;

    constructor(uint256 cairoContractAddress) {
        cairoCounter = cairoContractAddress;
    }

    function getCairoNumber() public view returns (uint256 counterValue) {
        bytes memory returnData = cairoCounter.staticcallCairo(FUNCTION_SELECTOR_NUMBER);

        // The return data is a 256-bit integer, so we can directly cast it to uint256
        return abi.decode(returnData, (uint256));
    }

    function getCairoNumberRaw() public view returns (bytes memory) {
        bytes memory returnData = cairoCounter.staticcallCairo(FUNCTION_SELECTOR_NUMBER);

        // The return data is a 256-bit integer, so we can directly cast it to uint256
        return returnData;
    }

    /// @notice Calls the Cairo contract to increment its internal number
    function incrementCairoNumber() external {
        cairoCounter.callCairo("increment");
    }

    /// @notice Calls the Cairo contract to set its internal number to an arbitrary value
    /// @dev The number value is split into two 128-bit values to match the Cairo contract's expected inputs (u256 is composed of two u128s)
    /// @param newNumber The new number value to set
    function setCairoNumber(uint256 newNumber) external {
        // The u256 input must be split into two u128 values to match the expected cairo input
        uint128 newNumberLow = uint128(newNumber);
        uint128 newNumberHigh = uint128(newNumber >> 128);

        uint256[] memory data = new uint256[](2);
        data[0] = uint256(newNumberLow);
        data[1] = uint256(newNumberHigh);
        cairoCounter.callCairo(FUNCTION_SELECTOR_SET_NUMBER, data);
    }
}
