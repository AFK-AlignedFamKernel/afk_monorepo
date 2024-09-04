// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

// import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../tokens/ERC20Launch.sol";
// contract PumpLaunch  is
//     ERC20Upgradeable,
//     OwnableUpgradeable,
//     AccessControlUpgradeable,
//     UUPSUpgradeable,
//     PausableUpgradeable
//  {

contract PumpLaunch  is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable
 {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");


    uint256 constant LIQUIDITY_RATIO= 5;

    struct SharesTokenUser {
        address owner;
        address token_address;
        uint256 price;
        uint256 amount_owned;
        uint256 amount_buy;
        uint256 amount_sell;
        uint256 total_paid;
        // uint64 created_at;
        uint256 created_at;
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
        // uint64 created_at;
        uint256 created_at;
    }

    struct Token {
        address owner;
        address token_address;
        string symbol;
        string name;
        uint256 total_supply;
        uint256 initial_supply;
        // uint64 created_at;
        uint256 created_at;
    }

    struct ParamsPool {
        address quoteAddress;
        uint256 initialKeyPrice;
        uint256 stepIncreaseLinear;
        uint256 thresholdLiquidity;
        uint256 thresholdMarketCap;
        
    }

    ParamsPool public paramsPump;

    mapping(uint256 => Token) public tokens;
    mapping(address => Token) public tokensCreated;
    mapping(uint256 => TokenLaunch) public launchs;


    // constructor(
    //     address _admin,
    //     uint256 _initialKeyPrice,
    //     address _quoteAddress,
    //     uint256 _stepIncreaseLinear,
    //     uint256 _thresholdLiquidity,
    //     uint256 _thresholdMarketCap ) {

    //     ParamsPool memory params=  ParamsPool ({
    //        initialKeyPrice: _initialKeyPrice,
    //        quoteAddress:_quoteAddress,
    //        stepIncreaseLinear:_stepIncreaseLinear,
    //        thresholdLiquidity:_thresholdLiquidity,
    //        thresholdMarketCap:_thresholdMarketCap
    //     });
    //     paramsPump=params;
    //     _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    //     _grantRole(MINTER_ROLE, _admin);
    //     _grantRole(UPGRADER_ROLE, _admin);
    //     _grantRole(PAUSER_ROLE, _admin);
    // }

    function initialize(
        address _admin,
        uint256 _initialKeyPrice,
        address _quoteAddress,
        uint256 _stepIncreaseLinear,
        uint256 _thresholdLiquidity,
        uint256 _thresholdMarketCap 
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(MINTER_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }


    function getLaunchPump(uint256 tokenAddress) public {

    }

    /** */
    function createToken(address recipient,
      string calldata symbol,
      string calldata name,
      uint256 initialSupply,
      bytes calldata contractAddressSalt
    ) public returns(address) {
        address tokenAddress= _createToken(recipient, msg.sender,  symbol, name, initialSupply);

        return tokenAddress;

    }

    function createAndLaunchToken(
         address recipient,
         string calldata symbol,
         string calldata name,
         uint256 initialSupply
        ) public returns (address) {

        address tokenAddress= _createToken(recipient, msg.sender, symbol, name, initialSupply);

        // _launchToken(coinAddress);


    }

    // Launch a token already deployed
    // Need to be approve or transfer to the launchpad
    function launchToken(
        address coinAddress
    )  public {

        _launchToken(coinAddress, msg.sender);

    }


    /** INTERNAL */

    // Deploy an ERC20
    // returns the address of the token deployed
    function _createToken(         
         address recipient,
         address owner,
         string calldata symbol,
         string calldata name,
         uint256 initialSupply) internal returns(address){

        // Deploy a new instance of the MyToken contract
        ERC20Launch token = new ERC20Launch(name, symbol, initialSupply, recipient);
          
        address tokenAddress =   address(token);
        Token memory tokenCreated = Token({
            owner:owner,
            token_address:tokenAddress,
            symbol:symbol,
            name:name,
            total_supply:initialSupply,
            initial_supply:initialSupply,
            created_at:block.timestamp // change date

        });

        // Add mapping

        return address(token);
    }
    function _launchToken(address coinAddress, address caller) internal {
        Token memory token = tokensCreated[coinAddress];

        address tokenAddress = token.token_address;
      // Create an instance of the IERC20 token
        IERC20 erc20 = IERC20(tokenAddress);

        // Call the totalSupply() function of the ERC20 token
        uint256 totalSupply = erc20.totalSupply();
        uint256 availableSupply= totalSupply / LIQUIDITY_RATIO;

        TokenLaunch memory launch = TokenLaunch({
            owner:token.owner,
            token_address:token.token_address,
            price:0, // calculate
            available_supply:totalSupply,
            total_supply:availableSupply,
            is_liquidity_launch:false,
            token_holded:0,
            liquidity_raised:0,
            initial_key_price:0,
            slop:0, // calculate
            created_at:block.timestamp// change date
        });

    }

    function buyToken(
        address coinAddress
    ) public {

    }

    function sellToken(
        address coinAddress
    ) public {

    }


    /** ADMINS */

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    
}