export const scoreFactoryABI = [
  {
    "type": "impl",
    "name": "FactoryNostrFiScoringImpl",
    "interface_name": "afk::infofi::score_factory::IFactoryNostrFiScoring"
  },
  {
    "type": "struct",
    "name": "afk::interfaces::common_interfaces::LinkedStarknetAddress",
    "members": [
      {
        "name": "starknet_address",
        "type": "core::starknet::contract_address::ContractAddress"
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
    "name": "afk::bip340::SchnorrSignature",
    "members": [
      {
        "name": "s",
        "type": "core::integer::u256"
      },
      {
        "name": "r",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk::social::request::SocialRequest::<afk::interfaces::common_interfaces::LinkedStarknetAddress>",
    "members": [
      {
        "name": "public_key",
        "type": "core::integer::u256"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "kind",
        "type": "core::integer::u16"
      },
      {
        "name": "tags",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "content",
        "type": "afk::interfaces::common_interfaces::LinkedStarknetAddress"
      },
      {
        "name": "sig",
        "type": "afk::bip340::SchnorrSignature"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::NostrMetadata",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256"
      },
      {
        "name": "name",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "about",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "event_id_nip_72",
        "type": "core::integer::u256"
      },
      {
        "name": "event_id_nip_29",
        "type": "core::integer::u256"
      },
      {
        "name": "main_tag",
        "type": "core::byte_array::ByteArray"
      }
    ]
  },
  {
    "type": "enum",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::TokenLaunchType",
    "variants": [
      {
        "name": "Later",
        "type": "()"
      },
      {
        "name": "Fairlaunch",
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
    "type": "interface",
    "name": "afk::infofi::score_factory::IFactoryNostrFiScoring",
    "items": [
      {
        "type": "function",
        "name": "create_dao_with_nostr",
        "inputs": [
          {
            "name": "request",
            "type": "afk::social::request::SocialRequest::<afk::interfaces::common_interfaces::LinkedStarknetAddress>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "create_dao",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "create_nostr_topic",
        "inputs": [
          {
            "name": "admin",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "admin_nostr_pubkey",
            "type": "core::integer::u256"
          },
          {
            "name": "main_token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "contract_address_salt",
            "type": "core::felt252"
          },
          {
            "name": "nostr_metadata",
            "type": "afk::interfaces::nostrfi_scoring_interfaces::NostrMetadata"
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
        "name": "create_token_topic_reward_and_vote",
        "inputs": [
          {
            "name": "token_type",
            "type": "afk::interfaces::nostrfi_scoring_interfaces::TokenLaunchType"
          },
          {
            "name": "is_create_staking_vault",
            "type": "core::bool"
          },
          {
            "name": "is_create_dao",
            "type": "core::bool"
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
        "name": "admin_nostr_pubkey",
        "type": "core::integer::u256"
      },
      {
        "name": "score_class_hash",
        "type": "core::starknet::class_hash::ClassHash"
      },
      {
        "name": "namespace_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::infofi::score_factory::TopicEvent",
    "kind": "struct",
    "members": [
      {
        "name": "topic_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "admin",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "admin_nostr_pubkey",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "score_class_hash",
        "type": "core::starknet::class_hash::ClassHash",
        "kind": "data"
      },
      {
        "name": "contract_address_salt",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "main_token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "deployer",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreEvent",
    "kind": "struct",
    "members": [
      {
        "name": "starknet_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "nostr_address",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "claimed_at",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "total_score_ai",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "total_nostr_address",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "total_points_weight",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "is_claimed",
        "type": "core::bool",
        "kind": "data"
      },
      {
        "name": "current_index_epoch",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::TipUserWithVote",
    "kind": "struct",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "starknet_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "current_index_epoch",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "amount_token",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "amount_vote",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "nostr_event_id",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::infofi::score_factory::CreateTokenTopicEvent",
    "kind": "struct",
    "members": [
      {
        "name": "main_token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "deployer",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "token_type",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::TokenLaunchType",
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
    "name": "afk::infofi::score_factory::FactoryNostrFiScoring::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "TopicEvent",
        "type": "afk::infofi::score_factory::TopicEvent",
        "kind": "nested"
      },
      {
        "name": "PushAlgoScoreEvent",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreEvent",
        "kind": "nested"
      },
      {
        "name": "TipUserWithVote",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::TipUserWithVote",
        "kind": "nested"
      },
      {
        "name": "CreateTokenTopicEvent",
        "type": "afk::infofi::score_factory::CreateTokenTopicEvent",
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
      }
    ]
  }
] as const;
