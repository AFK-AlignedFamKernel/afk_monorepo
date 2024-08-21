// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract Vault {
    mapping (address => uint) name;
    mapping (address => Deposit) depositUsers;

    struct Deposit {
        uint256 deposit;
        uint256 withdraw;
        address owner;
        
    }

    constructor() {
        
    }
}