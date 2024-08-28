// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract ABTCVault is Initializable, ERC20Upgradeable, ERC4626Upgradeable, AccessControlUpgradeable, UUPSUpgradeable, PausableUpgradeable {
    function decimals() public view virtual override(ERC20Upgradeable, ERC4626Upgradeable) returns (uint8) {
        return 18;
    }
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct WrappedBTC {
        bool isPermitted;
        uint256 ratio; 
        uint256 poolingTimestamp;
    }

    mapping(address => WrappedBTC) public wrappedBTCTokens;
    mapping(address => mapping(address => uint256)) public userDeposits;

    event TokenPermissionSet(address indexed token, bool isPermitted, uint256 ratio, uint256 poolingTimestamp);
    event Deposited(address indexed user, address indexed token, uint256 amount, uint256 mintedAmount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount, uint256 burnedAmount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _admin, address _underlying) initializer public {
        __ERC20_init("Aggregated Bitcoin", "aBTC");
        __ERC4626_init(IERC20(_underlying));
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }

    function setWrappedBTCToken(address _token, bool _isPermitted, uint256 _ratio, uint256 _poolingTimestamp) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_ratio > 0, "Invalid ratio");
        wrappedBTCTokens[_token] = WrappedBTC(_isPermitted, _ratio, _poolingTimestamp);
        emit TokenPermissionSet(_token, _isPermitted, _ratio, _poolingTimestamp);
    }

    function deposit(address _wrappedBTCToken, uint256 _amount) external whenNotPaused {
        WrappedBTC memory wrappedToken = wrappedBTCTokens[_wrappedBTCToken];
        require(wrappedToken.isPermitted, "Token not permitted");
        
        uint256 aBTCAmount = (_amount * wrappedToken.ratio) / 1e18;
        
        IERC20(_wrappedBTCToken).transferFrom(msg.sender, address(this), _amount);
        _mint(msg.sender, aBTCAmount);

        userDeposits[msg.sender][_wrappedBTCToken] += _amount;
        
        emit Deposited(msg.sender, _wrappedBTCToken, _amount, aBTCAmount);
    }

    function withdraw(address _wrappedBTCToken, uint256 _aBTCAmount) external whenNotPaused {
        WrappedBTC memory wrappedToken = wrappedBTCTokens[_wrappedBTCToken];
        require(wrappedToken.isPermitted, "Token not permitted");
        
        uint256 wrappedBTCAmount = (_aBTCAmount * 1e18) / wrappedToken.ratio;
        require(userDeposits[msg.sender][_wrappedBTCToken] >= wrappedBTCAmount, "Insufficient deposit");
        
        _burn(msg.sender, _aBTCAmount);
        IERC20(_wrappedBTCToken).transfer(msg.sender, wrappedBTCAmount);

        userDeposits[msg.sender][_wrappedBTCToken] -= wrappedBTCAmount;
        
        emit Withdrawn(msg.sender, _wrappedBTCToken, wrappedBTCAmount, _aBTCAmount);
    }

    function mint(address _to, uint256 _amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _burn(_from, _amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override whenNotPaused {
        super._deposit(caller, receiver, assets, shares);
    }

    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares) internal override whenNotPaused {
        super._withdraw(caller, receiver, owner, assets, shares);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}