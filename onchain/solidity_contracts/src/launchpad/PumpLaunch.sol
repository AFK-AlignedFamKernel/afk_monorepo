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
        uint256 threshold_liquidity;
        uint256 token_holded;
        bool is_liquidity_launch;
        address quote_address;
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


    /** TODO Opti mapping */
    mapping(uint256 => Token) public tokens;
    mapping(address => Token) public tokensCreated;
    mapping(uint256 => TokenLaunch) public launchs;
    mapping(address => TokenLaunch) public launchCreated;


    mapping(address => mapping(address => SharesTokenUser)) public shareUserByToken;


    ParamsPool public paramsPump;

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

        _launchToken(tokenAddress, msg.sender);


    }

    // Launch a token already deployed
    // Need to be approve or transfer to the launchpad
    function launchToken(
        address coinAddress
    )  public {

        _launchToken(coinAddress, msg.sender);

    }

    function buyToken(
        address coinAddress,
        uint256 quoteAmount
    ) public {

        TokenLaunch memory launch = launchCreated[coinAddress];

        // assert check if launch
        // check threshold and liquidity raised
        // Transfer quote amount
        IERC20 erc20 = IERC20(coinAddress);
        // Call the totalSupply() function of the ERC20 token
        bool transfer = erc20.transferFrom(msg.sender, address(this), quoteAmount);

        // Calculate price of token bought with quote
        uint256 coinAmount= _getBuyAmountCoinByQuote(coinAddress, quoteAmount);
        launch.available_supply-=coinAmount;

        SharesTokenUser storage share = shareUserByToken[msg.sender][coinAddress];

        if(share.owner == address(0)) {

            share.owner=msg.sender;
            share.total_paid=quoteAmount;

            share.token_address=coinAddress;
            share.amount_owned=coinAmount;
            share.amount_sell=0;
            share.amount_buy=coinAmount;

        } else {
            share.total_paid+=quoteAmount;

            share.amount_owned+=coinAmount;
            share.amount_buy+=coinAmount;
            
        }

        // Check if add liquidity to DEX

    }

    function sellToken(
        address coinAddress,
        uint256 quoteAmount

    ) public {

        TokenLaunch memory launch = launchCreated[coinAddress];

        // assert check if launch

        // check threshold and liquidity raised
        // Calculate price of token to sell with quote
        uint256 coinAmount= _getSellAmountCoinByQuote(coinAddress, quoteAmount);
        launch.available_supply+=coinAmount;

        SharesTokenUser storage share = shareUserByToken[msg.sender][coinAddress];
        require(share.owner != address(0), "not init");

        require(share.amount_owned >= coinAmount, "above balance");


        share.amount_owned-=coinAmount;
        share.amount_buy-=coinAmount;
        share.total_paid-=quoteAmount;
        share.amount_sell+=coinAmount;

    }

    /** PUBLIC VIEW */


    function getShareOfUser(address user, address coinAddress) public view returns(SharesTokenUser memory) {
        return shareUserByToken[user][coinAddress];
    }

    function getLaunch(address coinAddress) public view returns(TokenLaunch memory) {
        return launchCreated[coinAddress];
    }

    function getToken(address coinAddress) public view returns(Token memory) {
        return tokensCreated[coinAddress];
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

        // TODO Add mapping
        tokensCreated[tokenAddress] = tokenCreated;

        return address(token);
    }
    function _launchToken(address coinAddress, address caller) internal {
        Token memory token = tokensCreated[coinAddress];


        address tokenAddress = token.token_address;
        // Create an instance of the IERC20 token
        IERC20 erc20 = IERC20(tokenAddress);
        uint256 totalSupply = erc20.totalSupply();

        bool transfer= erc20.transferFrom(caller, address(this), totalSupply);

        // Call the totalSupply() function of the ERC20 token
        uint256 availableSupply= totalSupply / LIQUIDITY_RATIO;

        TokenLaunch memory launch = TokenLaunch({
            owner:token.owner,
            token_address:token.token_address,
            price:0, // calculate
            available_supply:availableSupply,
            total_supply:totalSupply,
            is_liquidity_launch:false,
            token_holded:0,
            liquidity_raised:0,
            quote_address:paramsPump.quoteAddress,
            threshold_liquidity:paramsPump.thresholdLiquidity,
            initial_key_price:0,
            slop:0, // calculate
            created_at:block.timestamp// change date
        });



        launchCreated[tokenAddress] = launch;

    }


    // @TODO verify bonding curve calcul 
    /** Buy amount bonding curve */
    function _getBuyAmountCoinByQuote(address coinAddress,
    uint256 quoteAmount

    
    ) internal returns(uint256) {

        TokenLaunch memory launch = launchCreated[coinAddress];

        // Assert and check
        // TODO verify calcul and data init
        uint256 tokenHold= launch.token_holded;
        uint256 liqRaised= launch.liquidity_raised;
        uint256 k = tokenHold* liqRaised;
        uint256 totalSupply= launch.total_supply;
        uint256 availableSupply= launch.available_supply;

        uint256 q_in= (totalSupply - availableSupply) - (k/quoteAmount);

        return q_in;

    }

    // @TODO verify bonding curve calcul 
    /** Sell amount bonding curve */
    function _getSellAmountCoinByQuote(address coinAddress,
        uint256 quoteAmount
    
    ) internal returns(uint256) {

        TokenLaunch memory launch = launchCreated[coinAddress];

        // Assert and check
        // TODO verify calcul and data init
        uint256 availableSupply= launch.available_supply;
        uint256 liqRaised= launch.liquidity_raised;
        uint256 initSupplyPool=availableSupply;
        uint256 supplyToBuy= launch.liquidity_raised;
        uint256 thresholdLiquidity= launch.threshold_liquidity;

        uint256 k = thresholdLiquidity * initSupplyPool;

        uint256 tokenHold= launch.token_holded;

        uint256 q_out= liqRaised + thresholdLiquidity / LIQUIDITY_RATIO - k / (tokenHold + quoteAmount);

        return q_out;
    }



    /** ADMINS */

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    
}