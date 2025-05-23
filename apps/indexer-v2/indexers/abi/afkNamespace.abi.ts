export const ABI = [
  {
    "type": "impl",
    "name": "NamespaceImpl",
    "interface_name": "afk::social::namespace::INostrNamespace"
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
    "name": "afk::social::namespace::NostrAccountScoring",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256"
      },
      {
        "name": "starknet_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "ai_score",
        "type": "core::integer::u256"
      }
    ]
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
    "name": "afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreNostrNote",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk::social::request::SocialRequest::<afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreNostrNote>",
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
        "type": "afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreNostrNote"
      },
      {
        "name": "sig",
        "type": "afk::bip340::SchnorrSignature"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::ProfileAlgorithmScoring",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256"
      },
      {
        "name": "starknet_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "ai_score",
        "type": "core::integer::u256"
      },
      {
        "name": "is_claimed",
        "type": "core::bool"
      },
      {
        "name": "total_score",
        "type": "core::integer::u256"
      },
      {
        "name": "veracity_score",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "interface",
    "name": "afk::social::namespace::INostrNamespace",
    "items": [
      {
        "type": "function",
        "name": "get_nostr_address_by_sn_default",
        "inputs": [
          {
            "name": "starknet_address",
            "type": "core::starknet::contract_address::ContractAddress"
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
        "name": "get_nostr_by_sn_default",
        "inputs": [
          {
            "name": "nostr_public_key",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_sn_by_nostr_default",
        "inputs": [
          {
            "name": "starknet_address",
            "type": "core::starknet::contract_address::ContractAddress"
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
        "name": "get_nostr_scoring_by_nostr_address",
        "inputs": [
          {
            "name": "nostr_address",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "afk::social::namespace::NostrAccountScoring"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "linked_nostr_profile",
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
        "name": "linked_nostr_default_account",
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
        "name": "set_control_role",
        "inputs": [
          {
            "name": "recipient",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "is_enable",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "add_nostr_profile_admin",
        "inputs": [
          {
            "name": "nostr_event_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "push_profile_score_algo",
        "inputs": [
          {
            "name": "request",
            "type": "afk::social::request::SocialRequest::<afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreNostrNote>"
          },
          {
            "name": "score_algo",
            "type": "afk::interfaces::nostrfi_scoring_interfaces::ProfileAlgorithmScoring"
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
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::social::namespace::Namespace::LinkedDefaultStarknetAddressEvent",
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
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::social::namespace::Namespace::AddStarknetAddressEvent",
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
        "name": "id",
        "type": "core::integer::u8",
        "kind": "key"
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
    "name": "afk::interfaces::nostrfi_scoring_interfaces::AdminAddNostrProfile",
    "kind": "struct",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256",
        "kind": "key"
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
    "name": "afk::social::namespace::Namespace::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "LinkedDefaultStarknetAddressEvent",
        "type": "afk::social::namespace::Namespace::LinkedDefaultStarknetAddressEvent",
        "kind": "nested"
      },
      {
        "name": "AddStarknetAddressEvent",
        "type": "afk::social::namespace::Namespace::AddStarknetAddressEvent",
        "kind": "nested"
      },
      {
        "name": "PushAlgoScoreEvent",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreEvent",
        "kind": "nested"
      },
      {
        "name": "AdminAddNostrProfile",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::AdminAddNostrProfile",
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
