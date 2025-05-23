export const ABI = [
  {
    "type": "impl",
    "name": "UpgradeableImpl",
    "interface_name": "openzeppelin_upgrades::interface::IUpgradeable"
  },
  {
    "type": "interface",
    "name": "openzeppelin_upgrades::interface::IUpgradeable",
    "items": [
      {
        "type": "function",
        "name": "upgrade",
        "inputs": [
          {
            "name": "new_class_hash",
            "type": "core::starknet::class_hash::ClassHash"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "LaunchpadMarketplace",
    "interface_name": "afk_launchpad::interfaces::launchpad::ILaunchpadMarketplace"
  },
  {
    "type": "struct",
    "name": "core::bytes_31::bytes31",
    "members": [
      {
        "name": "data",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::byte_array::ByteArray",
    "members": [
      {
        "name": "data",
        "type": "core::array::Array::<core::bytes_31::bytes31>"
      },
      {
        "name": "pending_word",
        "type": "core::felt252"
      },
      {
        "name": "pending_word_len",
        "type": "core::integer::u32"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "enum",
    "name": "afk_launchpad::types::launchpad_types::BondingType",
    "variants": [
      {
        "name": "Linear",
        "type": "()"
      },
      {
        "name": "Exponential",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk_launchpad::types::launchpad_types::MetadataLaunch",
    "members": [
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "url",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "nostr_event_id",
        "type": "core::integer::u256"
      },
      {
        "name": "twitter",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "github",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "telegram",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "website",
        "type": "core::byte_array::ByteArray"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::option::Option::<afk_launchpad::types::launchpad_types::MetadataLaunch>",
    "variants": [
      {
        "name": "Some",
        "type": "afk_launchpad::types::launchpad_types::MetadataLaunch"
      },
      {
        "name": "None",
        "type": "()"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk_launchpad::types::launchpad_types::TokenQuoteBuyCoin",
    "members": [
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "is_enable",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "enum",
    "name": "afk_launchpad::types::launchpad_types::LiquidityType",
    "variants": [
      {
        "name": "JediERC20",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "StarkDeFiERC20",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "EkuboNFT",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::option::Option::<afk_launchpad::types::launchpad_types::LiquidityType>",
    "variants": [
      {
        "name": "Some",
        "type": "afk_launchpad::types::launchpad_types::LiquidityType"
      },
      {
        "name": "None",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk_launchpad::types::launchpad_types::TokenLaunch",
    "members": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "price",
        "type": "core::integer::u256"
      },
      {
        "name": "available_supply",
        "type": "core::integer::u256"
      },
      {
        "name": "initial_pool_supply",
        "type": "core::integer::u256"
      },
      {
        "name": "initial_available_supply",
        "type": "core::integer::u256"
      },
      {
        "name": "total_supply",
        "type": "core::integer::u256"
      },
      {
        "name": "bonding_curve_type",
        "type": "afk_launchpad::types::launchpad_types::BondingType"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "token_quote",
        "type": "afk_launchpad::types::launchpad_types::TokenQuoteBuyCoin"
      },
      {
        "name": "liquidity_raised",
        "type": "core::integer::u256"
      },
      {
        "name": "total_token_holded",
        "type": "core::integer::u256"
      },
      {
        "name": "is_liquidity_launch",
        "type": "core::bool"
      },
      {
        "name": "slope",
        "type": "core::integer::u256"
      },
      {
        "name": "threshold_liquidity",
        "type": "core::integer::u256"
      },
      {
        "name": "liquidity_type",
        "type": "core::option::Option::<afk_launchpad::types::launchpad_types::LiquidityType>"
      },
      {
        "name": "starting_price",
        "type": "core::integer::u256"
      },
      {
        "name": "protocol_fee_percent",
        "type": "core::integer::u256"
      },
      {
        "name": "creator_fee_percent",
        "type": "core::integer::u256"
      },
      {
        "name": "creator_amount_received",
        "type": "core::integer::u256"
      },
      {
        "name": "creator_fee_destination",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "creator_amount_distributed",
        "type": "core::integer::u256"
      },
      {
        "name": "creator_amount_to_distribute",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk_launchpad::types::launchpad_types::SharesTokenUser",
    "members": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount_owned",
        "type": "core::integer::u256"
      },
      {
        "name": "amount_buy",
        "type": "core::integer::u256"
      },
      {
        "name": "amount_sell",
        "type": "core::integer::u256"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "total_paid",
        "type": "core::integer::u256"
      },
      {
        "name": "is_claimable",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "interface",
    "name": "afk_launchpad::interfaces::launchpad::ILaunchpadMarketplace",
    "items": [
      {
        "type": "function",
        "name": "create_token",
        "inputs": [
          {
            "name": "recipient",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "symbol",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "name",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "initial_supply",
            "type": "core::integer::u256"
          },
          {
            "name": "contract_address_salt",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "create_and_launch_token",
        "inputs": [
          {
            "name": "symbol",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "name",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "initial_supply",
            "type": "core::integer::u256"
          },
          {
            "name": "contract_address_salt",
            "type": "core::felt252"
          },
          {
            "name": "bonding_type",
            "type": "afk_launchpad::types::launchpad_types::BondingType"
          },
          {
            "name": "creator_fee_percent",
            "type": "core::integer::u256"
          },
          {
            "name": "creator_fee_destination",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "metadata",
            "type": "core::option::Option::<afk_launchpad::types::launchpad_types::MetadataLaunch>"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "launch_token",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "bonding_type",
            "type": "afk_launchpad::types::launchpad_types::BondingType"
          },
          {
            "name": "creator_fee_percent",
            "type": "core::integer::u256"
          },
          {
            "name": "creator_fee_destination",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "buy_coin_by_quote_amount",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "quote_amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "sell_coin",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "coin_amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "claim_coin_all",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "claim_coin_all_for_friend",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "friend",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "add_metadata",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "metadata",
            "type": "afk_launchpad::types::launchpad_types::MetadataLaunch"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_threshold_liquidity",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_default_token",
        "inputs": [],
        "outputs": [
          {
            "type": "afk_launchpad::types::launchpad_types::TokenQuoteBuyCoin"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_amount_by_type_of_coin_or_quote",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          },
          {
            "name": "is_decreased",
            "type": "core::bool"
          },
          {
            "name": "is_quote_amount",
            "type": "core::bool"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_coin_amount_by_quote_amount",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "quote_amount",
            "type": "core::integer::u256"
          },
          {
            "name": "is_decreased",
            "type": "core::bool"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_is_paid_launch_enable",
        "inputs": [],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_is_paid_create_token_enable",
        "inputs": [],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_amount_to_paid_launch",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_amount_to_paid_create_token",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_coin_launch",
        "inputs": [
          {
            "name": "key_user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "afk_launchpad::types::launchpad_types::TokenLaunch"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_share_of_user_by_contract",
        "inputs": [
          {
            "name": "owner",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "key_user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "afk_launchpad::types::launchpad_types::SharesTokenUser"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "set_token",
        "inputs": [
          {
            "name": "token_quote",
            "type": "afk_launchpad::types::launchpad_types::TokenQuoteBuyCoin"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_default_token",
        "inputs": [
          {
            "name": "default_token",
            "type": "afk_launchpad::types::launchpad_types::TokenQuoteBuyCoin"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_default_init_supply",
        "inputs": [
          {
            "name": "default_init_supply",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_force_default_init_supply",
        "inputs": [
          {
            "name": "is_default_init_supply",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_protocol_fee_percent",
        "inputs": [
          {
            "name": "protocol_fee_percent",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_creator_fee_percent",
        "inputs": [
          {
            "name": "creator_fee_percent",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_dollar_paid_coin_creation",
        "inputs": [
          {
            "name": "dollar_price",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_dollar_paid_launch_creation",
        "inputs": [
          {
            "name": "dollar_price",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_dollar_paid_finish_percentage",
        "inputs": [
          {
            "name": "bps",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_class_hash",
        "inputs": [
          {
            "name": "class_hash",
            "type": "core::starknet::class_hash::ClassHash"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_protocol_fee_destination",
        "inputs": [
          {
            "name": "protocol_fee_destination",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_unrug_liquidity_address",
        "inputs": [
          {
            "name": "unrug_liquidity_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_threshold_liquidity",
        "inputs": [
          {
            "name": "threshold_liquidity",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_fees",
        "inputs": [
          {
            "name": "is_fees_protocol_enabled",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_fees_protocol_enabled",
        "inputs": [
          {
            "name": "is_fees_protocol_enabled",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_fees_protocol_buy_enabled",
        "inputs": [
          {
            "name": "is_fees_protocol_buy_enabled",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_fees_protocol_sell_enabled",
        "inputs": [
          {
            "name": "is_fees_protocol_sell_enabled",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_paid_launch_enable",
        "inputs": [
          {
            "name": "is_paid_launch_enable",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_paid_create_token_enable",
        "inputs": [
          {
            "name": "is_paid_create_token_enable",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_amount_to_paid_launch",
        "inputs": [
          {
            "name": "amount_to_paid_launch",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_amount_to_paid_create_token",
        "inputs": [
          {
            "name": "amount_to_paid_create_token",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_token_address_for_action",
        "inputs": [
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_fees_creator_sell_enabled",
        "inputs": [
          {
            "name": "is_fees_creator_sell_enabled",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_fees_creator_buy_enabled",
        "inputs": [
          {
            "name": "is_fees_creator_buy_enabled",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_fees_creator_enabled",
        "inputs": [
          {
            "name": "is_fees_creator_enabled",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_is_creator_fee_sent_before_graduated",
        "inputs": [
          {
            "name": "is_creator_fee_sent_before_graduated",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "distribute_creator_fee",
        "inputs": [
          {
            "name": "coin_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_admin",
        "inputs": [
          {
            "name": "admin",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_role_address",
        "inputs": [
          {
            "name": "contract_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "role",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_revoke_address",
        "inputs": [
          {
            "name": "contract_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "role",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "AccessControlImpl",
    "interface_name": "openzeppelin_access::accesscontrol::interface::IAccessControl"
  },
  {
    "type": "interface",
    "name": "openzeppelin_access::accesscontrol::interface::IAccessControl",
    "items": [
      {
        "type": "function",
        "name": "has_role",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_role_admin",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "grant_role",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "revoke_role",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "renounce_role",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "SRC5Impl",
    "interface_name": "openzeppelin_introspection::interface::ISRC5"
  },
  {
    "type": "interface",
    "name": "openzeppelin_introspection::interface::ISRC5",
    "items": [
      {
        "type": "function",
        "name": "supports_interface",
        "inputs": [
          {
            "name": "interface_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "admin",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "coin_class_hash",
        "type": "core::starknet::class_hash::ClassHash"
      },
      {
        "name": "threshold_liquidity",
        "type": "core::integer::u256"
      },
      {
        "name": "threshold_market_cap",
        "type": "core::integer::u256"
      },
      {
        "name": "unrug_liquidity_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::StoredName",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "name",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::BuyToken",
    "kind": "struct",
    "members": [
      {
        "name": "caller",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "protocol_fee",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "quote_amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::SellToken",
    "kind": "struct",
    "members": [
      {
        "name": "caller",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "key_user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "protocol_fee",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "creator_fee",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "coin_amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::CreateToken",
    "kind": "struct",
    "members": [
      {
        "name": "caller",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "symbol",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "name",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "initial_supply",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "total_supply",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::CreateLaunch",
    "kind": "struct",
    "members": [
      {
        "name": "caller",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "quote_token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "price",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "total_supply",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "slope",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "threshold_liquidity",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "bonding_type",
        "type": "afk_launchpad::types::launchpad_types::BondingType",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::SetJediswapV2Factory",
    "kind": "struct",
    "members": [
      {
        "name": "address_jediswap_factory_v2",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::SetJediswapNFTRouterV2",
    "kind": "struct",
    "members": [
      {
        "name": "address_jediswap_nft_router_v2",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "enum",
    "name": "afk_launchpad::types::launchpad_types::SupportedExchanges",
    "variants": [
      {
        "name": "Jediswap",
        "type": "()"
      },
      {
        "name": "Ekubo",
        "type": "()"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::LiquidityCreated",
    "kind": "struct",
    "members": [
      {
        "name": "id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "pool",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "asset",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "quote_token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "exchange",
        "type": "afk_launchpad::types::launchpad_types::SupportedExchanges",
        "kind": "data"
      },
      {
        "name": "is_unruggable",
        "type": "core::bool",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::LiquidityCanBeAdded",
    "kind": "struct",
    "members": [
      {
        "name": "pool",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "asset",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "quote_token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::TokenClaimed",
    "kind": "struct",
    "members": [
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::MetadataCoinAdded",
    "kind": "struct",
    "members": [
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "url",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "nostr_event_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "twitter",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "website",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "telegram",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "github",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::types::launchpad_types::CreatorFeeDistributed",
    "kind": "struct",
    "members": [
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "creator_fee_destination",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "memecoin_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "previous_admin_role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "new_admin_role",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "RoleGranted",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
        "kind": "nested"
      },
      {
        "name": "RoleRevoked",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
        "kind": "nested"
      },
      {
        "name": "RoleAdminChanged",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_introspection::src5::SRC5Component::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
    "kind": "struct",
    "members": [
      {
        "name": "class_hash",
        "type": "core::starknet::class_hash::ClassHash",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "Upgraded",
        "type": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk_launchpad::launchpad::launchpad::LaunchpadMarketplace::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "StoredName",
        "type": "afk_launchpad::types::launchpad_types::StoredName",
        "kind": "nested"
      },
      {
        "name": "BuyToken",
        "type": "afk_launchpad::types::launchpad_types::BuyToken",
        "kind": "nested"
      },
      {
        "name": "SellToken",
        "type": "afk_launchpad::types::launchpad_types::SellToken",
        "kind": "nested"
      },
      {
        "name": "CreateToken",
        "type": "afk_launchpad::types::launchpad_types::CreateToken",
        "kind": "nested"
      },
      {
        "name": "CreateLaunch",
        "type": "afk_launchpad::types::launchpad_types::CreateLaunch",
        "kind": "nested"
      },
      {
        "name": "SetJediswapV2Factory",
        "type": "afk_launchpad::types::launchpad_types::SetJediswapV2Factory",
        "kind": "nested"
      },
      {
        "name": "SetJediswapNFTRouterV2",
        "type": "afk_launchpad::types::launchpad_types::SetJediswapNFTRouterV2",
        "kind": "nested"
      },
      {
        "name": "LiquidityCreated",
        "type": "afk_launchpad::types::launchpad_types::LiquidityCreated",
        "kind": "nested"
      },
      {
        "name": "LiquidityCanBeAdded",
        "type": "afk_launchpad::types::launchpad_types::LiquidityCanBeAdded",
        "kind": "nested"
      },
      {
        "name": "TokenClaimed",
        "type": "afk_launchpad::types::launchpad_types::TokenClaimed",
        "kind": "nested"
      },
      {
        "name": "MetadataCoinAdded",
        "type": "afk_launchpad::types::launchpad_types::MetadataCoinAdded",
        "kind": "nested"
      },
      {
        "name": "CreatorFeeDistributed",
        "type": "afk_launchpad::types::launchpad_types::CreatorFeeDistributed",
        "kind": "nested"
      },
      {
        "name": "AccessControlEvent",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
        "kind": "flat"
      },
      {
        "name": "SRC5Event",
        "type": "openzeppelin_introspection::src5::SRC5Component::Event",
        "kind": "flat"
      },
      {
        "name": "UpgradeableEvent",
        "type": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
        "kind": "flat"
      }
    ]
  }
] as const;
