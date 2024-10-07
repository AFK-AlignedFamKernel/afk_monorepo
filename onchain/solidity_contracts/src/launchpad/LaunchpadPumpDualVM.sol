// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {CairoLib} from "kakarot-lib/CairoLib.sol";

using CairoLib for uint256;

contract LaunchpadPumpDualVM {
    /// @dev The address of the cairo contract to call
    uint256 immutable starknetLaunchpad;
    /// @dev The address of the kakarot starknet contract to call
    uint256 immutable kakarot;

    mapping (address => uint256) evmToStarknetAddresses;
    mapping (uint256 => address) starknetToEvmAddresses;

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

    struct CairoTokenQuoteBuyCoin {
        uint256 tokenAddress;
        uint256 initialKeyPriceLow;
        uint256 initialKeyPriceHigh;
        uint256 priceLow;
        uint256 priceHigh;
        uint256 stepIncreaseLinearLow;
        uint256 stepIncreaseLinearHigh;
        bool isEnable;
    }

    struct CairoTokenLaunch {
        uint256 owner;
        uint256 tokenAddress;
        uint256 initialKeyPriceLow;
        uint256 initialKeyPriceHigh;
        uint256 priceLow;
        uint256 priceHigh;
        uint256 availableSupplyLow;
        uint256 availableSupplyHigh;
        uint256 initialPoolSupplyLow;
        uint256 initialPoolSupplyHigh;
        uint256 totalSupplyLow;
        uint256 totalSupplyHigh;
        uint256 bondingCurveType;
        BondingCurve bondingCurve;
        uint64 createdAt;
        CairoTokenQuoteBuyCoin tokenQuote;
        uint256 liquidityRaisedLow;
        uint256 liquidityRaisedHigh;
        uint256 tokenHoldedLow;
        uint256 tokenHoldedHigh;
        bool isLiquidityLaunch;
        uint256 slopeLow;
        uint256 slopeHigh;
        uint256 thresholdLiquidityLow;
        uint256 thresholdLiquidityHigh;
    }

    struct TokenQuoteBuyCoin {
        uint256 tokenAddress;
        uint256 initialKeyPrice;
        uint256 price;
        uint256 stepIncreaseLinear;
        bool isEnable;
    }

    enum BondingCurve {
        Linear,
        Trapezoidal,
        Scoring,
        Exponential,
        Limited
    }

    struct TokenLaunch {
        address owner;
        uint256 tokenAddress;
        uint256 initialKeyPrice;
        uint256 price;
        uint256 availableSupply;
        uint256 initialPoolSupply;
        uint256 totalSupply;
        BondingCurve bondingCurve;
        uint64 createdAt;
        TokenQuoteBuyCoin tokenQuote;
        uint256 liquidityRaised;
        uint256 tokenHolded;
        bool isLiquidityLaunch;
        uint256 slope;
        uint256 thresholdLiquidity;
    }

    struct CairoToken {
        uint256 owner;
        uint256 tokenAddress;
        uint256 symbol;
        uint256 name;
        uint256 totalSupplyLow;
        uint256 totalSupplyHigh;
        uint256 initialSupplyLow;
        uint256 initialSupplyHigh;
        TokenType tokenType;
        uint64 createdAt;
    }

    enum TokenType {
        ERC20,
        ERC404
    }

    struct Token {
        address owner;
        uint256 tokenAddress;
        bytes31 symbol;
        bytes31 name;
        uint256 totalSupply;
        uint256 initialSupply;
        TokenType tokenType;
        uint64 createdAt;
    }

    event CreateToken(
        address indexed caller,
        uint256 indexed tokenAddress,
        bytes31 symbol,
        bytes31 name,
        uint256 initialSupply,
        uint256 totalSupply
    );

    event CreateLaunch(
        address indexed caller,
        uint256 indexed tokenAddress,
        uint256 indexed quoteTokenAddress,
        uint256 amount,
        uint256 price,
        uint256 totalSupply,
        uint256 slope,
        uint256 thresholdLiquidity
    );

    constructor(uint256 _kakarot, uint256 _starknetLaunchpad) {
        kakarot = _kakarot;
        starknetLaunchpad = _starknetLaunchpad;
    }

    function bytes31ToUint256(bytes31 data) internal pure returns(uint256) {
        return uint256(bytes32(data) >> 8);
    }

    function uint256ToU256(uint256 data) internal pure returns(uint256, uint256) {
        uint128 low = uint128(data);
        uint128 high = uint128(data >> 128);
        return (low, high);
    }

    function uint256ToBytes31(uint256 data) internal pure returns(bytes31 result) {
        assembly {
            result := shl(8, data)
        }
    }

    function getAllCoins() public view returns(Token[] memory) {
        bytes memory returnData = starknetLaunchpad.staticcallCairo("get_all_coins");
        bytes32 offset = 0x0000000000000000000000000000000000000000000000000000000000000020;
        CairoToken[] memory cairoTokens = abi.decode(
            bytes.concat(offset, returnData),
            (CairoToken[])
        );
        Token[] memory tokens = new Token[](cairoTokens.length);
        for (uint256 i = 0; i < cairoTokens.length; ++i) {
            tokens[i].owner = starknetToEvmAddresses[cairoTokens[i].owner];
            tokens[i].tokenAddress = cairoTokens[i].tokenAddress;
            tokens[i].symbol = uint256ToBytes31(cairoTokens[i].symbol);
            tokens[i].name = uint256ToBytes31(cairoTokens[i].name);
            tokens[i].totalSupply = cairoTokens[i].totalSupplyLow +
                (cairoTokens[i].totalSupplyHigh << 128);
            tokens[i].initialSupply = cairoTokens[i].initialSupplyLow +
                (cairoTokens[i].initialSupplyHigh << 128);
            tokens[i].tokenType = cairoTokens[i].tokenType;
            tokens[i].createdAt = cairoTokens[i].createdAt;
        }
        return tokens;
    }

    function getCoinLaunch(uint256 tokenAddress) public view returns(TokenLaunch memory) {
        uint256[] memory getCoinLaunchCallData = new uint256[](1);
        getCoinLaunchCallData[0] = tokenAddress;
        bytes memory returnData = starknetLaunchpad.staticcallCairo(
            "get_coin_launch",
            getCoinLaunchCallData
        );
        CairoTokenLaunch memory cairoTokenLaunch = abi.decode(returnData, (CairoTokenLaunch));
        return TokenLaunch({
            owner: starknetToEvmAddresses[cairoTokenLaunch.owner],
            tokenAddress: cairoTokenLaunch.tokenAddress,
            initialKeyPrice: cairoTokenLaunch.initialKeyPriceLow +
                (cairoTokenLaunch.initialKeyPriceHigh << 128),
            price: cairoTokenLaunch.priceLow + (cairoTokenLaunch.priceHigh << 128),
            availableSupply: cairoTokenLaunch.availableSupplyLow +
                (cairoTokenLaunch.availableSupplyHigh << 128),
            initialPoolSupply: cairoTokenLaunch.initialPoolSupplyLow +
                (cairoTokenLaunch.initialPoolSupplyHigh << 128),
            totalSupply: cairoTokenLaunch.totalSupplyLow +
                (cairoTokenLaunch.totalSupplyHigh << 128),
            bondingCurve: cairoTokenLaunch.bondingCurve,
            createdAt: cairoTokenLaunch.createdAt,
            tokenQuote: TokenQuoteBuyCoin({
                tokenAddress: cairoTokenLaunch.tokenQuote.tokenAddress,
                initialKeyPrice: cairoTokenLaunch.tokenQuote.initialKeyPriceLow +
                    (cairoTokenLaunch.tokenQuote.initialKeyPriceHigh << 128),
                price: cairoTokenLaunch.tokenQuote.priceLow +
                    (cairoTokenLaunch.tokenQuote.priceHigh << 128),
                stepIncreaseLinear: cairoTokenLaunch.tokenQuote.stepIncreaseLinearLow +
                    (cairoTokenLaunch.tokenQuote.stepIncreaseLinearHigh << 128),
                isEnable: cairoTokenLaunch.tokenQuote.isEnable
            }),
            liquidityRaised: cairoTokenLaunch.liquidityRaisedLow +
                (cairoTokenLaunch.liquidityRaisedHigh << 128),
            tokenHolded: cairoTokenLaunch.tokenHoldedLow +
                (cairoTokenLaunch.tokenHoldedHigh << 128),
            isLiquidityLaunch: cairoTokenLaunch.isLiquidityLaunch,
            slope: cairoTokenLaunch.slopeLow + (cairoTokenLaunch.slopeHigh << 128),
            thresholdLiquidity: cairoTokenLaunch.thresholdLiquidityLow +
                (cairoTokenLaunch.thresholdLiquidityHigh << 128)
        });
    }

    function createToken(
        address recipient,
        bytes31 symbol,
        bytes31 name,
        uint256 initialSupply,
        bytes31 contractAddressSalt
    ) public {
        // Get owner
        if (evmToStarknetAddresses[msg.sender] == 0) {
            uint256[] memory ownerAddressCalldata = new uint256[](1);
            ownerAddressCalldata[0] = uint256(uint160(msg.sender));
            uint256 ownerStarknetAddress = abi.decode(
                kakarot.staticcallCairo("compute_starknet_address", ownerAddressCalldata),
                (uint256)
            );
            evmToStarknetAddresses[msg.sender] = ownerStarknetAddress;
            starknetToEvmAddresses[ownerStarknetAddress] = msg.sender;
        }
        // Get recipient
        if (evmToStarknetAddresses[recipient] == 0) {
            uint256[] memory recipientAddressCalldata = new uint256[](1);
            recipientAddressCalldata[0] = uint256(uint160(recipient));
            uint256 recipientStarknetAddress = abi.decode(
                kakarot.staticcallCairo("compute_starknet_address", recipientAddressCalldata),
                (uint256)
            );
            evmToStarknetAddresses[recipient] = recipientStarknetAddress;
            starknetToEvmAddresses[recipientStarknetAddress] = recipient;
        }
        uint256[] memory createTokenCallData = new uint256[](6);
        createTokenCallData[0] = evmToStarknetAddresses[recipient];
        createTokenCallData[1] = bytes31ToUint256(symbol);
        createTokenCallData[2] = bytes31ToUint256(name);
        (createTokenCallData[3], createTokenCallData[4]) = uint256ToU256(initialSupply);
        createTokenCallData[5] = bytes31ToUint256(contractAddressSalt);
        bytes memory returnData = starknetLaunchpad.delegatecallCairo(
            "create_token",
            createTokenCallData
        );
        uint tokenAddress = abi.decode(returnData, (uint256));
        emit CreateToken(
            msg.sender,
            tokenAddress,
            symbol,
            name,
            initialSupply,
            initialSupply
        );
    }

    function createAndLaunchToken(
        bytes31 symbol,
        bytes31 name,
        uint256 initialSupply,
        bytes31 contractAddressSalt
    ) public {
        // Get owner
        if (evmToStarknetAddresses[msg.sender] == 0) {
            uint256[] memory ownerAddressCalldata = new uint256[](1);
            ownerAddressCalldata[0] = uint256(uint160(msg.sender));
            uint256 ownerStarknetAddress = abi.decode(
                kakarot.staticcallCairo("compute_starknet_address", ownerAddressCalldata),
                (uint256)
            );
            evmToStarknetAddresses[msg.sender] = ownerStarknetAddress;
            starknetToEvmAddresses[ownerStarknetAddress] = msg.sender;
        }
        uint256[] memory createLaunchTokenCallData = new uint256[](5);
        createLaunchTokenCallData[0] = bytes31ToUint256(symbol);
        createLaunchTokenCallData[1] = bytes31ToUint256(name);
        (createLaunchTokenCallData[2], createLaunchTokenCallData[3]) = uint256ToU256(initialSupply);
        createLaunchTokenCallData[4] = bytes31ToUint256(contractAddressSalt);
        bytes memory returnData = starknetLaunchpad.delegatecallCairo(
            "create_and_launch_token",
            createLaunchTokenCallData
        );
        uint tokenAddress = abi.decode(returnData, (uint256));
        TokenLaunch memory tokenLaunch = getCoinLaunch(tokenAddress);
        emit CreateToken(
            msg.sender,
            tokenAddress,
            symbol,
            name,
            initialSupply,
            initialSupply
        );
        emit CreateLaunch(
            msg.sender,
            tokenAddress,
            tokenLaunch.tokenQuote.tokenAddress,
            0,
            tokenLaunch.initialKeyPrice,
            tokenLaunch.totalSupply,
            tokenLaunch.slope,
            tokenLaunch.thresholdLiquidity
        );
    }

    // Launch a token already deployed
    // Need to be approve or transfer to the launchpad
    function launchToken(uint256 tokenAddress) public {
        uint256[] memory launchTokenCalldata = new uint256[](1);
        launchTokenCalldata[0] = tokenAddress;
        starknetLaunchpad.delegatecallCairo("launch_token", launchTokenCalldata);
        TokenLaunch memory tokenLaunch = getCoinLaunch(tokenAddress);
        emit CreateLaunch(
            msg.sender,
            tokenAddress,
            tokenLaunch.tokenQuote.tokenAddress,
            0,
            tokenLaunch.initialKeyPrice,
            tokenLaunch.totalSupply,
            tokenLaunch.slope,
            tokenLaunch.thresholdLiquidity
        );
    }

    function buyTokenByQuoteAmount(uint256 tokenAddress, uint256 quoteAmount) public {
        uint256[] memory buyTokenByQuoteAmountCalldata = new uint256[](3);
        buyTokenByQuoteAmountCalldata[0] = tokenAddress;
        (buyTokenByQuoteAmountCalldata[1], buyTokenByQuoteAmountCalldata[2]) =
            uint256ToU256(quoteAmount);
        starknetLaunchpad.delegatecallCairo(
            "buy_coin_by_quote_amount",
            buyTokenByQuoteAmountCalldata
        );
    }

    function sellToken(uint256 tokenAddress, uint256 quoteAmount) public {
        uint256[] memory sellTokenCalldata = new uint256[](3);
        sellTokenCalldata[0] = tokenAddress;
        (sellTokenCalldata[1], sellTokenCalldata[2]) = uint256ToU256(quoteAmount);
        starknetLaunchpad.delegatecallCairo("sell_coin", sellTokenCalldata);
    }

    function getDefaultToken() public view returns(TokenQuoteBuyCoin memory) {
        bytes memory returnData = starknetLaunchpad.staticcallCairo("get_default_token");
        CairoTokenQuoteBuyCoin memory cairoTokenQuoteBuyCoin = abi.decode(
            returnData,
            (CairoTokenQuoteBuyCoin)
        );
        return TokenQuoteBuyCoin({
            tokenAddress: cairoTokenQuoteBuyCoin.tokenAddress,
            initialKeyPrice: cairoTokenQuoteBuyCoin.initialKeyPriceLow +
                (cairoTokenQuoteBuyCoin.initialKeyPriceHigh << 128),
            price: cairoTokenQuoteBuyCoin.priceLow +
                (cairoTokenQuoteBuyCoin.priceHigh << 128),
            stepIncreaseLinear: cairoTokenQuoteBuyCoin.stepIncreaseLinearLow +
                (cairoTokenQuoteBuyCoin.stepIncreaseLinearHigh << 128),
            isEnable: cairoTokenQuoteBuyCoin.isEnable
        });
    }

    function setToken(TokenQuoteBuyCoin memory quoteToken) public {
        uint256[] memory setTokenCalldata = new uint256[](8);
        setTokenCalldata[0] = quoteToken.tokenAddress;
        (setTokenCalldata[1], setTokenCalldata[2]) = uint256ToU256(quoteToken.initialKeyPrice);
        (setTokenCalldata[3], setTokenCalldata[4]) = uint256ToU256(quoteToken.price);
        (setTokenCalldata[5], setTokenCalldata[6]) = uint256ToU256(quoteToken.stepIncreaseLinear);
        setTokenCalldata[7] = quoteToken.isEnable ? 1 : 0;
        starknetLaunchpad.delegatecallCairo("set_token", setTokenCalldata);
    }
    
}