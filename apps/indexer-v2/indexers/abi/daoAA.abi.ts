export const ABI = [
  {
    type: 'impl',
    name: 'DaoAA',
    interface_name: 'afk::dao::dao_aa::IDaoAA',
  },
  {
    type: 'struct',
    name: 'core::integer::u256',
    members: [
      {
        name: 'low',
        type: 'core::integer::u128',
      },
      {
        name: 'high',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::bool',
    variants: [
      {
        name: 'False',
        type: '()',
      },
      {
        name: 'True',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::option::Option::<core::bool>',
    variants: [
      {
        name: 'Some',
        type: 'core::bool',
      },
      {
        name: 'None',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::option::Option::<core::starknet::contract_address::ContractAddress>',
    variants: [
      {
        name: 'Some',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'None',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::option::Option::<core::integer::u256>',
    variants: [
      {
        name: 'Some',
        type: 'core::integer::u256',
      },
      {
        name: 'None',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::option::Option::<core::integer::u64>',
    variants: [
      {
        name: 'Some',
        type: 'core::integer::u64',
      },
      {
        name: 'None',
        type: '()',
      },
    ],
  },
  {
    type: 'struct',
    name: 'afk::interfaces::voting::ConfigParams',
    members: [
      {
        name: 'is_admin_bypass_available',
        type: 'core::option::Option::<core::bool>',
      },
      {
        name: 'is_only_dao_execution',
        type: 'core::option::Option::<core::bool>',
      },
      {
        name: 'token_contract_address',
        type: 'core::option::Option::<core::starknet::contract_address::ContractAddress>',
      },
      {
        name: 'minimal_balance_voting',
        type: 'core::option::Option::<core::integer::u256>',
      },
      {
        name: 'max_balance_per_vote',
        type: 'core::option::Option::<core::integer::u256>',
      },
      {
        name: 'minimal_balance_create_proposal',
        type: 'core::option::Option::<core::integer::u256>',
      },
      {
        name: 'minimum_threshold_percentage',
        type: 'core::option::Option::<core::integer::u64>',
      },
    ],
  },
  {
    type: 'struct',
    name: 'afk::interfaces::voting::ConfigResponse',
    members: [
      {
        name: 'is_admin_bypass_available',
        type: 'core::bool',
      },
      {
        name: 'is_only_dao_execution',
        type: 'core::bool',
      },
      {
        name: 'token_contract_address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'minimal_balance_voting',
        type: 'core::integer::u256',
      },
      {
        name: 'max_balance_per_vote',
        type: 'core::integer::u256',
      },
      {
        name: 'minimal_balance_create_proposal',
        type: 'core::integer::u256',
      },
      {
        name: 'minimum_threshold_percentage',
        type: 'core::integer::u64',
      },
    ],
  },
  {
    type: 'interface',
    name: 'afk::dao::dao_aa::IDaoAA',
    items: [
      {
        type: 'function',
        name: 'get_public_key',
        inputs: [],
        outputs: [
          {
            type: 'core::integer::u256',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_token_contract_address',
        inputs: [],
        outputs: [
          {
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'update_config',
        inputs: [
          {
            name: 'config_params',
            type: 'afk::interfaces::voting::ConfigParams',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'get_config',
        inputs: [],
        outputs: [
          {
            type: 'afk::interfaces::voting::ConfigResponse',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'set_public_key',
        inputs: [
          {
            name: 'public_key',
            type: 'core::integer::u256',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    type: 'impl',
    name: 'DaoAAProposalImpl',
    interface_name: 'afk::interfaces::voting::IVoteProposal',
  },
  {
    type: 'struct',
    name: 'core::byte_array::ByteArray',
    members: [
      {
        name: 'data',
        type: 'core::array::Array::<core::bytes_31::bytes31>',
      },
      {
        name: 'pending_word',
        type: 'core::felt252',
      },
      {
        name: 'pending_word_len',
        type: 'core::integer::u32',
      },
    ],
  },
  {
    type: 'enum',
    name: 'afk::interfaces::voting::ProposalType',
    variants: [
      {
        name: 'SavedAutomatedTransaction',
        type: '()',
      },
      {
        name: 'Execution',
        type: '()',
      },
      {
        name: 'Proposal',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'afk::interfaces::voting::ProposalAutomatedTransaction',
    variants: [
      {
        name: 'Transfer',
        type: '()',
      },
      {
        name: 'Mint',
        type: '()',
      },
      {
        name: 'Burn',
        type: '()',
      },
      {
        name: 'Buy',
        type: '()',
      },
      {
        name: 'Sell',
        type: '()',
      },
      {
        name: 'Invest',
        type: '()',
      },
      {
        name: 'Withdraw',
        type: '()',
      },
    ],
  },
  {
    type: 'struct',
    name: 'afk::interfaces::voting::ProposalParams',
    members: [
      {
        name: 'content',
        type: 'core::byte_array::ByteArray',
      },
      {
        name: 'proposal_type',
        type: 'afk::interfaces::voting::ProposalType',
      },
      {
        name: 'proposal_automated_transaction',
        type: 'afk::interfaces::voting::ProposalAutomatedTransaction',
      },
    ],
  },
  {
    type: 'struct',
    name: 'core::array::Span::<core::felt252>',
    members: [
      {
        name: 'snapshot',
        type: '@core::array::Array::<core::felt252>',
      },
    ],
  },
  {
    type: 'struct',
    name: 'core::starknet::account::Call',
    members: [
      {
        name: 'to',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'selector',
        type: 'core::felt252',
      },
      {
        name: 'calldata',
        type: 'core::array::Span::<core::felt252>',
      },
    ],
  },
  {
    type: 'enum',
    name: 'afk::interfaces::voting::UserVote',
    variants: [
      {
        name: 'Yes',
        type: '()',
      },
      {
        name: 'No',
        type: '()',
      },
      {
        name: 'Abstention',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::option::Option::<afk::interfaces::voting::UserVote>',
    variants: [
      {
        name: 'Some',
        type: 'afk::interfaces::voting::UserVote',
      },
      {
        name: 'None',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'afk::interfaces::voting::ProposalStatus',
    variants: [
      {
        name: 'Pending',
        type: '()',
      },
      {
        name: 'Active',
        type: '()',
      },
      {
        name: 'Passed',
        type: '()',
      },
      {
        name: 'Failed',
        type: '()',
      },
      {
        name: 'Executed',
        type: '()',
      },
      {
        name: 'Canceled',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'afk::interfaces::voting::ProposalResult',
    variants: [
      {
        name: 'InProgress',
        type: '()',
      },
      {
        name: 'Passed',
        type: '()',
      },
      {
        name: 'Failed',
        type: '()',
      },
      {
        name: 'Executed',
        type: '()',
      },
      {
        name: 'Canceled',
        type: '()',
      },
    ],
  },
  {
    type: 'struct',
    name: 'afk::interfaces::voting::Proposal',
    members: [
      {
        name: 'id',
        type: 'core::integer::u256',
      },
      {
        name: 'created_at',
        type: 'core::integer::u64',
      },
      {
        name: 'end_at',
        type: 'core::integer::u64',
      },
      {
        name: 'is_whitelisted',
        type: 'core::bool',
      },
      {
        name: 'proposal_params',
        type: 'afk::interfaces::voting::ProposalParams',
      },
      {
        name: 'proposal_status',
        type: 'afk::interfaces::voting::ProposalStatus',
      },
      {
        name: 'proposal_result',
        type: 'afk::interfaces::voting::ProposalResult',
      },
      {
        name: 'proposal_result_at',
        type: 'core::integer::u64',
      },
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'proposal_result_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    type: 'interface',
    name: 'afk::interfaces::voting::IVoteProposal',
    items: [
      {
        type: 'function',
        name: 'create_proposal',
        inputs: [
          {
            name: 'proposal_params',
            type: 'afk::interfaces::voting::ProposalParams',
          },
          {
            name: 'calldata',
            type: 'core::array::Array::<core::starknet::account::Call>',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u256',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'cast_vote',
        inputs: [
          {
            name: 'proposal_id',
            type: 'core::integer::u256',
          },
          {
            name: 'opt_vote_type',
            type: 'core::option::Option::<afk::interfaces::voting::UserVote>',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'get_proposal',
        inputs: [
          {
            name: 'proposal_id',
            type: 'core::integer::u256',
          },
        ],
        outputs: [
          {
            type: 'afk::interfaces::voting::Proposal',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_user_vote',
        inputs: [
          {
            name: 'proposal_id',
            type: 'core::integer::u256',
          },
          {
            name: 'user',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'afk::interfaces::voting::UserVote',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'cancel_proposal',
        inputs: [
          {
            name: 'proposal_id',
            type: 'core::integer::u256',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'process_result',
        inputs: [
          {
            name: 'proposal_id',
            type: 'core::integer::u256',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'is_executable',
        inputs: [
          {
            name: 'calldata',
            type: 'core::starknet::account::Call',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
    ],
  },
  {
    type: 'impl',
    name: 'ISRC6Impl',
    interface_name: 'afk::dao::dao_aa::ISRC6',
  },
  {
    type: 'interface',
    name: 'afk::dao::dao_aa::ISRC6',
    items: [
      {
        type: 'function',
        name: '__execute__',
        inputs: [
          {
            name: 'calls',
            type: 'core::array::Array::<core::starknet::account::Call>',
          },
        ],
        outputs: [
          {
            type: 'core::array::Array::<core::array::Span::<core::felt252>>',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: '__validate__',
        inputs: [
          {
            name: 'calls',
            type: 'core::array::Array::<core::starknet::account::Call>',
          },
        ],
        outputs: [
          {
            type: 'core::felt252',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'is_valid_signature',
        inputs: [
          {
            name: 'hash',
            type: 'core::felt252',
          },
          {
            name: 'signature',
            type: 'core::array::Array::<core::felt252>',
          },
        ],
        outputs: [
          {
            type: 'core::felt252',
          },
        ],
        state_mutability: 'view',
      },
    ],
  },
  {
    type: 'impl',
    name: 'AccessControlImpl',
    interface_name: 'openzeppelin_access::accesscontrol::interface::IAccessControl',
  },
  {
    type: 'interface',
    name: 'openzeppelin_access::accesscontrol::interface::IAccessControl',
    items: [
      {
        type: 'function',
        name: 'has_role',
        inputs: [
          {
            name: 'role',
            type: 'core::felt252',
          },
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_role_admin',
        inputs: [
          {
            name: 'role',
            type: 'core::felt252',
          },
        ],
        outputs: [
          {
            type: 'core::felt252',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'grant_role',
        inputs: [
          {
            name: 'role',
            type: 'core::felt252',
          },
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'revoke_role',
        inputs: [
          {
            name: 'role',
            type: 'core::felt252',
          },
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'renounce_role',
        inputs: [
          {
            name: 'role',
            type: 'core::felt252',
          },
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    type: 'impl',
    name: 'SRC5Impl',
    interface_name: 'openzeppelin_introspection::interface::ISRC5',
  },
  {
    type: 'interface',
    name: 'openzeppelin_introspection::interface::ISRC5',
    items: [
      {
        type: 'function',
        name: 'supports_interface',
        inputs: [
          {
            name: 'interface_id',
            type: 'core::felt252',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
    ],
  },
  {
    type: 'constructor',
    name: 'constructor',
    inputs: [
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'token_contract_address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'public_key',
        type: 'core::integer::u256',
      },
      {
        name: 'starknet_address',
        type: 'core::felt252',
      },
    ],
  },
  {
    type: 'event',
    name: 'afk::dao::dao_aa::DaoAA::AccountCreated',
    kind: 'struct',
    members: [
      {
        name: 'public_key',
        type: 'core::integer::u256',
        kind: 'key',
      },
    ],
  },
  {
    type: 'event',
    name: 'afk::interfaces::voting::ProposalCreated',
    kind: 'struct',
    members: [
      {
        name: 'id',
        type: 'core::integer::u256',
        kind: 'key',
      },
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'created_at',
        type: 'core::integer::u64',
        kind: 'data',
      },
      {
        name: 'end_at',
        type: 'core::integer::u64',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'afk::interfaces::voting::ProposalVoted',
    kind: 'struct',
    members: [
      {
        name: 'id',
        type: 'core::integer::u256',
        kind: 'key',
      },
      {
        name: 'voter',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'vote',
        type: 'afk::interfaces::voting::UserVote',
        kind: 'data',
      },
      {
        name: 'votes',
        type: 'core::integer::u256',
        kind: 'data',
      },
      {
        name: 'total_votes',
        type: 'core::integer::u256',
        kind: 'data',
      },
      {
        name: 'voted_at',
        type: 'core::integer::u64',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'afk::interfaces::voting::ProposalCanceled',
    kind: 'struct',
    members: [
      {
        name: 'id',
        type: 'core::integer::u256',
        kind: 'key',
      },
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'is_canceled',
        type: 'core::bool',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'afk::interfaces::voting::ProposalResolved',
    kind: 'struct',
    members: [
      {
        name: 'id',
        type: 'core::integer::u256',
        kind: 'key',
      },
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'result',
        type: 'afk::interfaces::voting::ProposalResult',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted',
    kind: 'struct',
    members: [
      {
        name: 'role',
        type: 'core::felt252',
        kind: 'data',
      },
      {
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'sender',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked',
    kind: 'struct',
    members: [
      {
        name: 'role',
        type: 'core::felt252',
        kind: 'data',
      },
      {
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'sender',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged',
    kind: 'struct',
    members: [
      {
        name: 'role',
        type: 'core::felt252',
        kind: 'data',
      },
      {
        name: 'previous_admin_role',
        type: 'core::felt252',
        kind: 'data',
      },
      {
        name: 'new_admin_role',
        type: 'core::felt252',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event',
    kind: 'enum',
    variants: [
      {
        name: 'RoleGranted',
        type: 'openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted',
        kind: 'nested',
      },
      {
        name: 'RoleRevoked',
        type: 'openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked',
        kind: 'nested',
      },
      {
        name: 'RoleAdminChanged',
        type: 'openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged',
        kind: 'nested',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_introspection::src5::SRC5Component::Event',
    kind: 'enum',
    variants: [],
  },
  {
    type: 'event',
    name: 'openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded',
    kind: 'struct',
    members: [
      {
        name: 'class_hash',
        type: 'core::starknet::class_hash::ClassHash',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event',
    kind: 'enum',
    variants: [
      {
        name: 'Upgraded',
        type: 'openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded',
        kind: 'nested',
      },
    ],
  },
  {
    type: 'event',
    name: 'afk::dao::dao_aa::DaoAA::Event',
    kind: 'enum',
    variants: [
      {
        name: 'AccountCreated',
        type: 'afk::dao::dao_aa::DaoAA::AccountCreated',
        kind: 'nested',
      },
      {
        name: 'ProposalCreated',
        type: 'afk::interfaces::voting::ProposalCreated',
        kind: 'nested',
      },
      {
        name: 'ProposalVoted',
        type: 'afk::interfaces::voting::ProposalVoted',
        kind: 'nested',
      },
      {
        name: 'ProposalCanceled',
        type: 'afk::interfaces::voting::ProposalCanceled',
        kind: 'nested',
      },
      {
        name: 'ProposalResolved',
        type: 'afk::interfaces::voting::ProposalResolved',
        kind: 'nested',
      },
      {
        name: 'AccessControlEvent',
        type: 'openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event',
        kind: 'flat',
      },
      {
        name: 'SRC5Event',
        type: 'openzeppelin_introspection::src5::SRC5Component::Event',
        kind: 'flat',
      },
      {
        name: 'UpgradeableEvent',
        type: 'openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event',
        kind: 'flat',
      },
    ],
  },
] as const;
