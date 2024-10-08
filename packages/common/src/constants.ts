export const ACCOUNT_TEST_PROFILE = {
  alice: {
    name: "alice.xyz",
    pubkey: "",
    strkKey: "",
    // nostrPk: "5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc",
    nostrPublicKey:
      "5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc",
    nostrPrivateKey:
      "59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35",
    // contract:"0x261d2434b2583293b7dd2048cb9c0984e262ed0a3eb70a19ed4eac6defef8b1",
    contract:
      "0x65d17b5c8fca3da3c45a4b7a97007331d51860e6843094fa98040b3962b741b",
  },
  bob: {
    name: "afk.xyz",
    pubkey: "",
    strkKey: "",
    /** FIRST TEST */
    /*** Dummy data */
    nostrPrivateKey:
      "70aca2a9ab722bd56a9a1aadae7f39bc747c7d6735a04d677e0bc5dbefa71d47",
    nostrPublicKey:
      "d6f1cf53f9f52d876505164103b1e25811ec4226a17c7449576ea48b00578171",

    contract:
      "0x1b5f5bee60ce25d6979c5b88cfbb74ad1dae197dba11719b2e06a5efa7e666d",
  },
};

export const ERROR_MESSAGES = {
  EVENT_NOTE_INVALID: {
    label: "EVENT_NOTE_INVALID",
    message: "The note event provided is invalid",
  },
  ADDRESS_INVALID: {
    label: "ADDRESS_INVALID",
    message: "The address of the receiver or sender are invalid",
  },
  PAY_REQUEST_NOT_FOUND: {
    label: "PAY_REQUEST_NOT_FOUND",
    message: "The pay request content on the event note is not correct",
  },
};
