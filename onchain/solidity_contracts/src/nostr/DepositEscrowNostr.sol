// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {CairoLib} from "kakarot-lib/CairoLib.sol";
import {DualVMToken} from "../examples/DualVmToken.sol";

using CairoLib for uint256;

contract DepositEscrowNostr {

    /// @dev The address of the starknet token to call
    uint256 immutable depositAddress;

    /// @dev The address of the starknet token to call
    uint256 immutable kakarot;

    // mapping (address => uint) name;
    // mapping (address => Deposit) depositUsers;
    mapping (address => uint256) evmToStarknetAddresses;
    mapping (uint256 => address) starknetToEvmAddresses;

    struct Content {
        uint256 depositId;
        address recipient;
        address gasTokenAddress;
        uint256 gasAmount;
    }

    struct Signature {
        uint256 r;
        uint256 s;
    }

    struct SocialRequestClaim {
        uint256 publicKey;
        uint64 createdAt;
        uint16 kind;
        bytes tags;
        Content content;
        Signature sig;
    }

    struct Deposit {
        address sender;
        uint256 amount;
        address tokenAddress;
        uint256 nostrRecipient;
        uint64 ttl;
    }

    enum DepositResult {
        Transfer,
        Deposit
    }

    event TransferEvent(
        address indexed sender,
        uint256 indexed nostrRecipient,
        address indexed recipient,
        uint256 amount,
        address tokenAddress
    );

    event DepositEvent(
        uint256 indexed depositId,
        address indexed sender,
        uint256 indexed nostrRecipient,
        uint256 amount,
        address tokenAddress
    );

    event CancelEvent(
        uint256 indexed depositId,
        address indexed sender,
        uint256 indexed nostrRecipient,
        uint256 amount,
        address tokenAddress
    );

    event ClaimEvent(
        uint256 indexed depositId,
        address indexed sender,
        uint256 indexed nostrRecipient,
        address recipient,
        uint256 amount,
        address tokenAddress,
        address gasTokenAddress,
        uint256 gasAmount
    );

    constructor(uint256 _kakarot, uint256 _depositAddress) {
        kakarot = _kakarot;
        depositAddress = _depositAddress;
    }

    function bytesFeltToUint256(bytes calldata b) internal pure returns (uint256) {
        require(b.length <= 31, "Byte array should be no longer than 31 bytes");
        return abi.decode(abi.encodePacked(new bytes(32 - b.length), b), (uint256));
    }

    function getDeposit(uint256 depositId) public view returns(Deposit memory) {
        uint256[] memory depositCallData = new uint256[](1);
        depositCallData[0] = depositId;
        (
            uint256 sender,
            uint128 amountLow, uint128 amountHigh,
            uint256 tokenAddress,
            uint128 nostrRecipientLow, uint128 nostrRecipientHigh,
            uint64 ttl
        ) = abi.decode(
            depositAddress.staticcallCairo("get_deposit", depositCallData),
            (uint256, uint128, uint128, uint256, uint128, uint128, uint64)
        );
        return Deposit({
            sender: starknetToEvmAddresses[sender],
            amount: uint256(amountLow) + (uint256(amountHigh) << 128),
            tokenAddress: starknetToEvmAddresses[tokenAddress],
            nostrRecipient: uint256(nostrRecipientLow) + (uint256(nostrRecipientHigh) << 128),
            ttl: ttl
        });
    }

    function depositTo(
        uint256 amount,
        address tokenAddress,
        uint256 nostrRecipient,
        uint64 timelock
    ) public returns(DepositResult, uint256) {
        // Get sender address
        if (evmToStarknetAddresses[msg.sender] == 0) {
            uint256[] memory kakarotCallData = new uint256[](1);
            kakarotCallData[0] = uint256(uint160(msg.sender));
            uint256 senderStarknetAddress = abi.decode(
                kakarot.staticcallCairo("compute_starknet_address", kakarotCallData),
                (uint256)
            );
            evmToStarknetAddresses[msg.sender] = senderStarknetAddress;
            starknetToEvmAddresses[senderStarknetAddress] = msg.sender;
        }
        // Get token address
        if(evmToStarknetAddresses[tokenAddress] == 0) {
            uint256 tokenStarknetAddress = DualVMToken(tokenAddress).starknetTokenAddress();
            evmToStarknetAddresses[tokenAddress] = tokenStarknetAddress;
            starknetToEvmAddresses[tokenStarknetAddress] = tokenAddress;
        }

        uint256[] memory depositCallData = new uint256[](6);
        // Split amount in [low, high]
        depositCallData[0] = uint128(amount);
        depositCallData[1] = uint128(amount >> 128);
        depositCallData[2] = evmToStarknetAddresses[tokenAddress];
        // Split recipient in [low, high]
        depositCallData[3] = uint128(nostrRecipient);
        depositCallData[4] = uint128(nostrRecipient >> 128);
        depositCallData[5] = timelock;
        bytes memory returnData = depositAddress.delegatecallCairo("deposit", depositCallData);
        (DepositResult depositResultType, uint256 depositResultPayload) =
            abi.decode(returnData, (DepositResult, uint256));
        if (depositResultType == DepositResult.Transfer) {
            emit TransferEvent(
                msg.sender,
                nostrRecipient,
                starknetToEvmAddresses[depositResultPayload],
                amount,
                tokenAddress
            );
        } else if (depositResultType == DepositResult.Deposit) {
            emit DepositEvent(
                depositResultPayload,
                msg.sender,
                nostrRecipient,
                amount,
                tokenAddress
            );
        }
        return (depositResultType, depositResultPayload);
    }

    function cancel(uint256 depositId) public {
        Deposit memory deposit = getDeposit(depositId);
        uint256[] memory depositCallData = new uint256[](1);
        depositCallData[0] = depositId;
        depositAddress.delegatecallCairo("cancel", depositCallData);
        emit CancelEvent(
            depositId,
            deposit.sender,
            deposit.nostrRecipient,
            deposit.amount,
            deposit.tokenAddress
        );
    }

    function claim(SocialRequestClaim calldata request, uint256 gasAmount) public {
        Deposit memory deposit = getDeposit(request.content.depositId);
        // Get recipient address
        if (evmToStarknetAddresses[request.content.recipient] == 0) {
            uint256[] memory kakarotCallData = new uint256[](1);
            kakarotCallData[0] = uint256(uint160(request.content.recipient));
            uint256 recipientStarknetAddress = abi.decode(
                kakarot.staticcallCairo("compute_starknet_address", kakarotCallData),
                (uint256)
            );
            evmToStarknetAddresses[request.content.recipient] = recipientStarknetAddress;
            starknetToEvmAddresses[recipientStarknetAddress] = request.content.recipient;
        }
        // Get token address
        if(evmToStarknetAddresses[request.content.gasTokenAddress] == 0) {
            uint256 tokenStarknetAddress =
                DualVMToken(request.content.gasTokenAddress).starknetTokenAddress();
            evmToStarknetAddresses[request.content.gasTokenAddress] = tokenStarknetAddress;
            starknetToEvmAddresses[tokenStarknetAddress] = request.content.gasTokenAddress;
        }
        uint256[] memory depositCallData = new uint256[](18);
        depositCallData[0] = uint128(request.publicKey);
        depositCallData[1] = uint128(request.publicKey >> 128);
        depositCallData[2] = request.createdAt;
        depositCallData[3] = request.kind;
        depositCallData[4] = 0;
        depositCallData[5] = bytesFeltToUint256(request.tags);
        depositCallData[6] = request.tags.length;
        depositCallData[7] = request.content.depositId;
        depositCallData[8] = evmToStarknetAddresses[request.content.recipient];
        depositCallData[9] = evmToStarknetAddresses[request.content.gasTokenAddress];
        depositCallData[10] = uint128(request.content.gasAmount);
        depositCallData[11] = uint128(request.content.gasAmount >> 128);
        depositCallData[12] = uint128(request.sig.r);
        depositCallData[13] = uint128(request.sig.r >> 128);
        depositCallData[14] = uint128(request.sig.s);
        depositCallData[15] = uint128(request.sig.s >> 128);
        depositCallData[16] = uint128(gasAmount);
        depositCallData[17] = uint128(gasAmount >> 128);
        depositAddress.delegatecallCairo("claim", depositCallData);
        emit ClaimEvent(
            request.content.depositId,
            msg.sender,
            request.publicKey,
            request.content.recipient,
            deposit.amount,
            deposit.tokenAddress,
            request.content.gasTokenAddress,
            request.content.gasAmount
        );
    }
    
}