// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/Test.sol";
import "../src/defi/Vault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

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

    // Declare custom errors
    error AccessControlUnauthorizedAccount(address account, bytes32 role);
    error EnforcedPause();

    function setUp() public {
        admin = address(this);
    
        user1 = address(0x1);
        user2 = address(0x2);
    
        wbtc = new MockWrappedBTC("Wrapped BTC", "WBTC");
        tbtc = new MockWrappedBTC("tBTC", "TBTC");
    
        // Deploy the implementation contract
        ABTCVault implementation = new ABTCVault();
    
        // Initialize data for proxy constructor
        bytes memory data = abi.encodeWithSignature(
            "initialize(address,address)",
            admin,
            address(wbtc)
        );
    
        // Deploy the proxy contract pointing to the implementation
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            data
        );
    
        // Cast the proxy to the ABTCVault type
        vault = ABTCVault(address(proxy));
    
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
        assertTrue(vault.hasRole(vault.ADMIN_ROLE(), admin));
        assertTrue(vault.hasRole(vault.MINTER_ROLE(), admin));
        assertTrue(vault.hasRole(vault.UPGRADER_ROLE(), admin));
        assertTrue(vault.hasRole(vault.PAUSER_ROLE(), admin));
    }

    function testSetWrappedBTCToken() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        (bool isPermitted, uint256 poolingTimestamp, uint256 ratio) = vault
            .wrappedBTCTokens(address(wbtc));
        assertTrue(isPermitted);
        assertEq(poolingTimestamp, block.timestamp);
        assertEq(ratio, 1e18);
    }

    function testSetWrappedBTCTokenUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                AccessControlUnauthorizedAccount.selector,
                user1,
                vault.ADMIN_ROLE()
            )
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
            abi.encodeWithSelector(
                AccessControlUnauthorizedAccount.selector,
                user1,
                vault.MINTER_ROLE()
            )
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
            abi.encodeWithSelector(
                AccessControlUnauthorizedAccount.selector,
                user1,
                vault.MINTER_ROLE()
            )
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
            abi.encodeWithSelector(
                AccessControlUnauthorizedAccount.selector,
                user1,
                vault.PAUSER_ROLE()
            )
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
        vm.expectRevert(EnforcedPause.selector);
        vault.deposit(address(wbtc), depositAmount);
    }

    function testWithdrawWhenPaused() public {
        vault.setWrappedBTCToken(address(wbtc), true, 1e18, block.timestamp);
        uint256 depositAmount = 100 * 1e18;
        wbtc.approve(address(vault), depositAmount);
        vault.deposit(address(wbtc), depositAmount);
        vault.pause();
        vm.expectRevert(EnforcedPause.selector);
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

        vault.deposit(address(wbtc), wbtcAmount); // Mints 100 aBTC
        vault.deposit(address(tbtc), tbtcAmount); // Mints 100 aBTC (50 * 2)

        assertEq(vault.balanceOf(address(this)), 200 * 1e18);
    }
}