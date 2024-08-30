// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/Test.sol";
import "../src/defi/Vault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWrappedBTC is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10 ** 18);
    }
}

contract ABTCVaultTest is Test {
    ABTCVault public vault;
    MockWrappedBTC public wbtc;
    MockWrappedBTC public tbtc;
    address public admin;
    address public user1;
    address public user2;

    function setUp() public {
        admin = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        wbtc = new MockWrappedBTC("Wrapped BTC", "WBTC");
        tbtc = new MockWrappedBTC("tBTC", "TBTC");

        // vault = new ABTCVault();
        vault = new ABTCVault(admin, address(wbtc));
        vault.initialize(admin, address(wbtc));

        vm.label(address(vault), "ABTCVault");
        vm.label(address(wbtc), "WBTC");
        vm.label(address(tbtc), "TBTC");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
    }

    function testInitialization() public {
        assertEq(vault.name(), "Aggregated Bitcoin");
        assertEq(vault.symbol(), "aBTC");
        assertEq(vault.decimals(), 18);
        assertTrue(vault.hasRole(vault.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(vault.hasRole(vault.MINTER_ROLE(), admin));
        assertTrue(vault.hasRole(vault.UPGRADER_ROLE(), admin));
        assertTrue(vault.hasRole(vault.PAUSER_ROLE(), admin));
    }

    function testSetWrappedBTCToken() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        (bool isPermitted, uint256 poolingTimestamp) = vault.wrappedBTCTokens(
            address(wbtc)
        );
        assertTrue(isPermitted);
        assertEq(poolingTimestamp, block.timestamp);
    }

    function testSetWrappedBTCTokenUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert(
            "AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
        );
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
    }

    function testDeposit() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        uint256 depositAmount = 100 * 1e18;
        wbtc.approve(address(vault), depositAmount);
        vault.deposit(address(wbtc), depositAmount);
        assertEq(vault.balanceOf(address(this)), depositAmount);
        assertEq(wbtc.balanceOf(address(vault)), depositAmount);
    }

    function testDepositUnauthorizedToken() public {
        uint256 depositAmount = 100 * 1e18;
        tbtc.approve(address(vault), depositAmount);
        vm.expectRevert("Token not permitted");
        vault.deposit(address(tbtc), depositAmount);
    }

    function testWithdraw() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        uint256 depositAmount = 100 * 1e18;
        wbtc.approve(address(vault), depositAmount);
        vault.deposit(address(wbtc), depositAmount);

        uint256 withdrawAmount = 50 * 1e18;
        vault.withdraw(address(wbtc), withdrawAmount);
        assertEq(
            vault.balanceOf(address(this)),
            depositAmount - withdrawAmount
        );
        assertEq(
            wbtc.balanceOf(address(this)),
            1000000 * 1e18 - depositAmount + withdrawAmount
        );
    }

    function testWithdrawInsufficientBalance() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        uint256 depositAmount = 100 * 1e18;
        wbtc.approve(address(vault), depositAmount);
        vault.deposit(address(wbtc), depositAmount);

        uint256 withdrawAmount = 150 * 1e18;
        vm.expectRevert("Insufficient deposit");
        vault.withdraw(address(wbtc), withdrawAmount);
    }

    function testMint() public {
        uint256 mintAmount = 100 * 1e18;
        vault.mint(user1, mintAmount);
        assertEq(vault.balanceOf(user1), mintAmount);
    }

    function testMintUnauthorized() public {
        uint256 mintAmount = 100 * 1e18;
        vm.prank(user1);
        vm.expectRevert(
            "AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
        );
        vault.mint(user2, mintAmount);
    }

    function testBurn() public {
        uint256 mintAmount = 100 * 1e18;
        vault.mint(user1, mintAmount);
        vault.burn(user1, mintAmount);
        assertEq(vault.balanceOf(user1), 0);
    }

    function testBurnUnauthorized() public {
        uint256 mintAmount = 100 * 1e18;
        vault.mint(user1, mintAmount);
        vm.prank(user1);
        vm.expectRevert(
            "AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
        );
        vault.burn(user1, mintAmount);
    }

    function testPause() public {
        vault.pause();
        assertTrue(vault.paused());
    }

    function testPauseUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert(
            "AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a"
        );
        vault.pause();
    }

    function testUnpause() public {
        vault.pause();
        vault.unpause();
        assertFalse(vault.paused());
    }

    function testDepositWhenPaused() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        vault.pause();
        uint256 depositAmount = 100 * 1e18;
        wbtc.approve(address(vault), depositAmount);
        vm.expectRevert("Pausable: paused");
        vault.deposit(address(wbtc), depositAmount);
    }

    function testWithdrawWhenPaused() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        uint256 depositAmount = 100 * 1e18;
        wbtc.approve(address(vault), depositAmount);
        vault.deposit(address(wbtc), depositAmount);
        vault.pause();
        vm.expectRevert("Pausable: paused");
        vault.withdraw(address(wbtc), depositAmount);
    }

    function testMultipleDepositsAndWithdrawals() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        vault.setWrappedBTCToken(address(tbtc), true, 1e18, block.timestamp);

        uint256 wbtcAmount = 100 * 1e18;
        uint256 tbtcAmount = 50 * 1e18;

        wbtc.approve(address(vault), wbtcAmount);
        tbtc.approve(address(vault), tbtcAmount);

        vault.deposit(address(wbtc), wbtcAmount);
        vault.deposit(address(tbtc), tbtcAmount);

        assertEq(vault.balanceOf(address(this)), wbtcAmount + tbtcAmount);

        vault.withdraw(address(wbtc), 30 * 1e18);
        vault.withdraw(address(tbtc), 20 * 1e18);

        assertEq(vault.balanceOf(address(this)), 100 * 1e18);
        assertEq(wbtc.balanceOf(address(vault)), 70 * 1e18);
        assertEq(tbtc.balanceOf(address(vault)), 30 * 1e18);
    }

    function testDifferentRatios() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp); // 1:1 ratio
        vault.setWrappedBTCToken(address(tbtc), true, 2e18, block.timestamp); // 2:1 ratio

        uint256 wbtcAmount = 100 * 1e18;
        uint256 tbtcAmount = 50 * 1e18;

        wbtc.approve(address(vault), wbtcAmount);
        tbtc.approve(address(vault), tbtcAmount);

        vault.deposit(address(wbtc), wbtcAmount);
        vault.deposit(address(tbtc), tbtcAmount);

        assertEq(vault.balanceOf(address(this)), wbtcAmount + (tbtcAmount * 2));
    }
}
