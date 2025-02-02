export default {
  DECIMALS: 18,
  STARTING_BLOCK: 450_000,
  STARTING_BLOCK_UNRUG: 615_556,
  STARTING_BLOCK_MAINNET: 615_556,
  contracts: {
    mainnet: {
      FACTORY_ADDRESS:
        '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',
      UNRUGGABLE_FACTORY_ADDRESS:
        '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',
    },
    sepolia: {
      // LAUNCHPAD_ADDRESS:"0x6579503122e7564117f2192d6a66ec81b51dfd551b39a4fa26046044cd39a35",
      // LAUNCHPAD_ADDRESS:
      //   '0x4cefb7ab4c3fda72df52f288e141ff1dc6956a497949bf7b0031f012f3d3afc',
      LAUNCHPAD_ADDRESS:"0x4a5d414ec6085ef5d3779b6e72015076b1a1ecdb6065fe1123d794ff41aea4d",
      NAMESERVICE_ADDRESS:
        '0x15dcd3c28c07846fa98d3a40d29446de21b5e6cd8d49a43773da0f237d5ea7f',
      ESCROW_DEPOSIT_ADDRESS:
        '0x7323351c9e497ef4cc59cfdacdc8ba7b07c6b4aaeb07e78dfda0988f6e8e3ee',
    },
  },
  apibara: {
    MAX_RECEIVE_MESSAGE_LENGTH: 128 * 1_048_576,
  },
};
