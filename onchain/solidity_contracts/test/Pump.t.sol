// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

// Import the test utilities from Foundry
import "forge-std/Test.sol";
import "../src/launchpad/PumpLaunch.sol"; // Adjust the path to your PumpLaunch contract
import "../src/tokens/ERC20Launch.sol";   // Adjust the path to your ERC20Launch contract
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Define the test contract
contract PumpLaunchTest is Test {
    PumpLaunch pumpLaunch;
    ERC20Launch testToken;
    ERC20Launch quoteToken; // Define an ERC20 token to act as the quote token (ETH or other ERC20)

    address admin = address(0xABCD); // Define an arbitrary admin address
    address user = address(0x1234);  // Define an arbitrary user address

    function setUp() public {
        // Deploy PumpLaunch contract
        pumpLaunch = new PumpLaunch();

        // Deploy a test ERC20 token to act as the quote token
        quoteToken = new ERC20Launch("QuoteToken", "QT", 10000 * 10**18, admin);

        // Initialize PumpLaunch contract with the quote token
        pumpLaunch.initialize(
            admin,
            1000,               // initialKeyPrice
            address(quoteToken),// quoteAddress
            10,                 // stepIncreaseLinear
            1000*10**18,               // thresholdLiquidity or 10**18
            10000,              // thresholdMarketCap
            2000 // 20% liquidityPercentage:
        );

        // Deploy a test ERC20 token to interact with (TestToken)
        testToken = new ERC20Launch("TestToken", "TTK", 10000 * 10**18, admin);

        // Label addresses for easier reading in test outputs
        vm.label(admin, "Admin");
        vm.label(user, "User");
        vm.label(address(testToken), "TestToken");
        vm.label(address(quoteToken), "QuoteToken");
        vm.label(address(pumpLaunch), "PumpLaunch");
    }

    function testCreateToken() public {
        // Call createToken function and check if token is created
        vm.prank(admin); // Admin creates a token
        address newToken = pumpLaunch.createToken(
            user, 
            "NEW", 
            "NewToken", 
            5000 * 10**18
        );

        // Verify the token address is valid and stored
        assert(newToken != address(0));
        assertEq(pumpLaunch.getToken(newToken).token_address, newToken);
    }

    function testCreateAndLaunchToken() public {
        // Call createToken function and check if token is created
        vm.prank(admin); // Admin creates a token
        address newToken = pumpLaunch.createAndLaunchToken(
            user, 
            "NEW", 
            "NewToken", 
            5000 * 10**18
        );

        // Verify the token address is valid and stored
        assert(newToken != address(0));
        assertEq(pumpLaunch.getToken(newToken).token_address, newToken);

        assertEq(pumpLaunch.getLaunch(newToken).token_address, newToken);

    }

    function testBuyToken() public {
        // Admin launches token
        vm.prank(admin);
        address tokenAddress = pumpLaunch.createAndLaunchToken(
            admin, 
            "TEST", 
            "TestToken", 
            // 1000 * 10**18
            100000 * 10**18
        );

        vm.prank(admin);
        pumpLaunch.launchToken(tokenAddress);

        // Simulate user having quote tokens and approving the PumpLaunch contract
        deal(address(quoteToken), user, 100 * 10**18); // Fund user with quote tokens (QT)
        vm.prank(user);
        IERC20(address(quoteToken)).approve(address(pumpLaunch), 100 * 10**18); // Approve 10 QT

        // Perform buy transaction using quote tokens
        vm.prank(user);
        pumpLaunch.buyToken(tokenAddress, 100 * 10**18);

        // Verify user's share has been updated
        // (address owner, , , uint256 amountOwned, , , ) = pumpLaunch.getShareOfUser(user, tokenAddress);
        // assertEq(owner, user);
        // assertEq(amountOwned, 50 * 10**18); // Assume the entire quote amount was used to buy tokens
    }

    function testSellToken() public {
           // Admin launches token
        vm.prank(admin);
        address tokenAddress = pumpLaunch.createAndLaunchToken(
            admin, 
            "TEST", 
            "TestToken", 
            // 1000 * 10**18
            100000 * 10**18
        );

        vm.prank(admin);
        pumpLaunch.launchToken(tokenAddress);

        // Simulate user having quote tokens and approving the PumpLaunch contract
        deal(address(quoteToken), user, 100 * 10**18); // Fund user with quote tokens (QT)
        vm.prank(user);
        IERC20(address(quoteToken)).approve(address(pumpLaunch), 100 * 10**18); // Approve 10 QT


        // Perform buy transaction using quote tokens
        vm.prank(user);
        pumpLaunch.buyToken(tokenAddress, 100 * 10**18);

        // // Approve tokens to be sold
        // IERC20(address(quoteToken)).approve(address(pumpLaunch), 30 * 10**18);

        // Perform sell transaction
        vm.prank(user);
        pumpLaunch.sellToken(address(tokenAddress), 10 * 10**18);

        // Verify user's share has been updated
        // (address owner, , , uint256 amountOwned, , , ) = pumpLaunch.getShareOfUser(user, address(testToken));
        // assertEq(owner, user);
        // assertEq(amountOwned, 20 * 10**18); // 50 bought initially - 30 sold
    }

    function testFailSellTokenWithoutBalance() public {
        // Attempt to sell tokens without balance should fail
        vm.expectRevert();
        vm.prank(user);
        pumpLaunch.sellToken(address(testToken), 10 * 10**18);
    }
}
