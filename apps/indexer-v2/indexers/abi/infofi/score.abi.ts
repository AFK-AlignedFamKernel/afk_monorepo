export const ABI = [
  {
    "type": "impl",
    "name": "NostrFiScoringImpl",
    "interface_name": "afk::interfaces::nostrfi_scoring_interfaces::INostrFiScoring"
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
    "type": "struct",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::NostrFiAdminStorage",
    "members": [
      {
        "name": "quote_token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "is_paid_storage_pubkey_profile",
        "type": "core::bool"
      },
      {
        "name": "is_paid_storage_event_id",
        "type": "core::bool"
      },
      {
        "name": "amount_paid_storage_pubkey_profile",
        "type": "core::integer::u256"
      },
      {
        "name": "amount_paid_storage_event_id",
        "type": "core::integer::u256"
      },
      {
        "name": "is_multi_token_vote",
        "type": "core::bool"
      },
      {
        "name": "amount_paid_for_subscription",
        "type": "core::integer::u256"
      },
      {
        "name": "vote_token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "subscription_time",
        "type": "core::integer::u64"
      },
      {
        "name": "percentage_algo_score_distribution",
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
    "name": "afk::interfaces::nostrfi_scoring_interfaces::DepositRewardsType",
    "variants": [
      {
        "name": "General",
        "type": "()"
      }
    ]
  },
  {
    "type": "enum",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::Vote",
    "variants": [
      {
        "name": "Good",
        "type": "()"
      },
      {
        "name": "Bad",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::VoteNostrNote",
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
        "name": "vote",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::Vote"
      },
      {
        "name": "is_upvote",
        "type": "core::bool"
      },
      {
        "name": "upvote_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "downvote_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "amount_token",
        "type": "core::integer::u256"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk::social::request::SocialRequest::<afk::interfaces::nostrfi_scoring_interfaces::VoteNostrNote>",
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
        "type": "afk::interfaces::nostrfi_scoring_interfaces::VoteNostrNote"
      },
      {
        "name": "sig",
        "type": "afk::bip340::SchnorrSignature"
      }
    ]
  },
  {
    "type": "struct",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::VoteParams",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256"
      },
      {
        "name": "vote",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::Vote"
      },
      {
        "name": "is_upvote",
        "type": "core::bool"
      },
      {
        "name": "upvote_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "downvote_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      },
      {
        "name": "amount_token",
        "type": "core::integer::u256"
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
        "name": "picture",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "nip05",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "lud06",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "lud16",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "main_tag",
        "type": "core::byte_array::ByteArray"
      }
    ]
  },
  {
    "type": "interface",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::INostrFiScoring",
    "items": [
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
      },
      {
        "type": "function",
        "name": "set_change_batch_interval",
        "inputs": [
          {
            "name": "epoch_duration",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_admin_nostr_pubkey",
        "inputs": [
          {
            "name": "admin_nostr_pubkey",
            "type": "core::integer::u256"
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
        "name": "set_admin_params",
        "inputs": [
          {
            "name": "admin_params",
            "type": "afk::interfaces::nostrfi_scoring_interfaces::NostrFiAdminStorage"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
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
        "name": "deposit_rewards",
        "inputs": [
          {
            "name": "amount",
            "type": "core::integer::u256"
          },
          {
            "name": "deposit_rewards_type",
            "type": "afk::interfaces::nostrfi_scoring_interfaces::DepositRewardsType"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "vote_token_profile",
        "inputs": [
          {
            "name": "request",
            "type": "afk::social::request::SocialRequest::<afk::interfaces::nostrfi_scoring_interfaces::VoteNostrNote>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "vote_nostr_profile_starknet_only",
        "inputs": [
          {
            "name": "vote_params",
            "type": "afk::interfaces::nostrfi_scoring_interfaces::VoteParams"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "distribute_rewards_by_user",
        "inputs": [
          {
            "name": "starknet_user_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "epoch_index",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "claim_and_distribute_my_rewards",
        "inputs": [
          {
            "name": "epoch_index",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_admin_params",
        "inputs": [],
        "outputs": [
          {
            "type": "afk::interfaces::nostrfi_scoring_interfaces::NostrFiAdminStorage"
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
        "name": "add_metadata",
        "inputs": [
          {
            "name": "metadata",
            "type": "afk::interfaces::nostrfi_scoring_interfaces::NostrMetadata"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "add_topics_metadata",
        "inputs": [
          {
            "name": "keywords",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "main_topic",
            "type": "core::byte_array::ByteArray"
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
        "name": "deployer",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "main_token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "admin_nostr_pubkey",
        "type": "core::integer::u256"
      },
      {
        "name": "namespace_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::infofi::nostrfi_scoring::NostrFiScoring::LinkedDefaultStarknetAddressEvent",
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
    "name": "afk::infofi::nostrfi_scoring::NostrFiScoring::TipToClaimByUserBecauseNotLinked",
    "kind": "struct",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "amount_token",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::DistributionRewardsByUserEvent",
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
        "name": "current_index_epoch",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "claimed_at",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "amount_algo",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "amount_vote",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "amount_total",
        "type": "core::integer::u256",
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
    "name": "afk::interfaces::nostrfi_scoring_interfaces::AddTopicsMetadataEvent",
    "kind": "struct",
    "members": [
      {
        "name": "current_index_keywords",
        "type": "core::integer::u64",
        "kind": "key"
      },
      {
        "name": "keywords",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "main_topic",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::NostrMetadataEvent",
    "kind": "struct",
    "members": [
      {
        "name": "nostr_address",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "main_tag",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "about",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "event_id_nip_72",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "event_id_nip_29",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::DepositRewardsByUserEvent",
    "kind": "struct",
    "members": [
      {
        "name": "starknet_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "epoch_index",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "amount_token",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "afk::interfaces::nostrfi_scoring_interfaces::NewEpochEvent",
    "kind": "struct",
    "members": [
      {
        "name": "old_epoch_index",
        "type": "core::integer::u64",
        "kind": "key"
      },
      {
        "name": "current_index_epoch",
        "type": "core::integer::u64",
        "kind": "key"
      },
      {
        "name": "start_duration",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "end_duration",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "epoch_duration",
        "type": "core::integer::u64",
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
    "name": "afk::infofi::nostrfi_scoring::NostrFiScoring::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "LinkedDefaultStarknetAddressEvent",
        "type": "afk::infofi::nostrfi_scoring::NostrFiScoring::LinkedDefaultStarknetAddressEvent",
        "kind": "nested"
      },
      {
        "name": "AdminAddNostrProfile",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::AdminAddNostrProfile",
        "kind": "nested"
      },
      {
        "name": "TipToClaimByUserBecauseNotLinked",
        "type": "afk::infofi::nostrfi_scoring::NostrFiScoring::TipToClaimByUserBecauseNotLinked",
        "kind": "nested"
      },
      {
        "name": "DistributionRewardsByUserEvent",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::DistributionRewardsByUserEvent",
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
        "name": "AddTopicsMetadataEvent",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::AddTopicsMetadataEvent",
        "kind": "nested"
      },
      {
        "name": "NostrMetadataEvent",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::NostrMetadataEvent",
        "kind": "nested"
      },
      {
        "name": "DepositRewardsByUserEvent",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::DepositRewardsByUserEvent",
        "kind": "nested"
      },
      {
        "name": "NewEpochEvent",
        "type": "afk::interfaces::nostrfi_scoring_interfaces::NewEpochEvent",
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
]