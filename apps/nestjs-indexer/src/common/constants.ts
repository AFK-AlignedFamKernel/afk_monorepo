export default {
  DECIMALS: 18,
  STARTING_BLOCK: 140_000,
  STARTING_BLOCK_UNRUG: 615_556,
  STREAM_URL: {
    mainnet: '',
    sepolia: 'https://sepolia.starknet.a5a.ch',
  },
  contracts: {
    mainnet: {
      FACTORY_ADDRESS:
        '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',
      UNRUGGABLE_FACTORY_ADDRESS:
        '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc',
    },
    sepolia: {
      LAUNCHPAD_ADDRESS:
        '0x1e00d0d7167938c2aa289850c96d7129ff16c1ed02b7542030bc2e39dc41885',
      NAMESERVICE_ADDRESS:
        '0x15dcd3c28c07846fa98d3a40d29446de21b5e6cd8d49a43773da0f237d5ea7f',
    },
  },
  event_keys: {
    BUY_TOKEN:
      '0xcb205b7506d21e6fe528cd4ae2ce69ae63eb6fc10a2d0234dd39ef3d349797',
  },
  apibara: {
    MAX_RECEIVE_MESSAGE_LENGTH: 128 * 1_048_576,
  },
};
