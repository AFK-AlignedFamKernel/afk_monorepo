// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import the OpenZeppelin ERC20 implementation
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Define a new contract that inherits from ERC20 and Ownable (for owner-based permissions)
contract ERC20Launch is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply, address recipient) ERC20(name, symbol) {
        // Mint the initial supply of tokens to the contract deployer (owner)
        _mint(msg.sender, initialSupply);
    }
}