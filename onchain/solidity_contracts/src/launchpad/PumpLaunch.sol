// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract PumpLaunch {

    struct SharesTokenUser {
        address owner;
        address token_address;
        uint256 price;
        uint256 amount_owned;
        uint256 amount_buy;
        uint256 amount_sell;
        uint256 total_paid;
        uint64 created_at;
    }

    struct TokenLaunch {
        address owner;
        address token_address;
        uint256 price;
        uint256 available_supply;
        uint256 total_supply;
        uint256 initial_key_price;
        uint256 liquidity_raised;
        uint256 token_holded;
        bool is_liquidity_launch;
        uint256 slop;
        uint64 created_at;
    }

    struct Token {
        address owner;
        address token_address;
        bytes symbol;
        bytes name;
        uint256 total_supply;
        uint256 initial_supply;
        uint64 created_at;
    }

    struct ParamsPool {
        address quoteAddress;
        uint256 initialKeyPrice;
        uint256 stepIncreaseLinear;
        uint256 thresholdLiquidity;
        uint256 thresholdMarketCap;
        
    }

    ParamsPool public paramsPump;


    constructor(
        address _admin,
        uint256 _initialKeyPrice,
        address _quoteAddress,
        uint256 _stepIncreaseLinear,
        uint256 _thresholdLiquidity,
        uint256 _thresholdMarketCap ) {

        ParamsPool memory params=  ParamsPool ({
           initialKeyPrice: _initialKeyPrice,
           quoteAddress:_quoteAddress,
           stepIncreaseLinear:_stepIncreaseLinear,
           thresholdLiquidity:_thresholdLiquidity,
           thresholdMarketCap:_thresholdMarketCap
        });
        paramsPump=params;
    }

    function getLaunchPump(uint256 tokenAddress) public {

    }

    /** */
    function createToken(address recipient,
      bytes calldata symbol,
      bytes calldata name,
      uint256 initialSupply,
      bytes calldata contractAddressSalt
    ) public {

    }

    function createAndLaunchToken(
         address recipient,
         bytes calldata symbol,
         bytes calldata name,
         uint256 initialSupply
        ) public {

        // let _createToken(recipient, symbol, name, initialSupply);

        // _launchToken(coinAddress);


    }

    // Launch a token already deployed
    // Need to be approve or transfer to the launchpad
    function launchToken(
        address coinAddress
    )  public {

        _launchToken(coinAddress);

    }

    // Deploy an ERC20
    // returns the address of the token deployed
    function _createToken(         address recipient,
         bytes calldata symbol,
         bytes calldata name,
         uint256 initialSupply) internal {

    }
    function _launchToken(address coinAddress) internal {

    }

    function buyToken(
        address coinAddress
    ) public {

    }

    function sellToken(
        address coinAddress
    ) public {

    }

    
}