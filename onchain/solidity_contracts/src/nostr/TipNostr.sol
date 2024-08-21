// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract TipNostr {
    mapping (address => uint) name;
    mapping (address => Deposit) depositUsers;

    struct Deposit {
        uint256 deposit;
        uint256 withdraw;
        uint256 nostrAddress;
        address owner;
    }

    constructor() {
        
    }

    function depositTo(uint256 nostrAddress) public {

    }

    function claim() public {
        
    }

    
}