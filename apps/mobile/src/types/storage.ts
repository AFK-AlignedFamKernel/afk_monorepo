
export interface GeneratePasskeyValues {
    // publicKey: string,
    nameChallenge?: string,
    nameRp?: string,
    publicKey?: string,
    user?: {
      id?: string;
      name?: string;
      displayName?: string;
    },
    pubKeyCredParams: [{ type: string, alg: number}],

    // secretKey: string,

  }

  export const DEFAULT_PASSKEY_VALUES: GeneratePasskeyValues = {
    nameChallenge: "afk-key-challenge",
    nameRp: "AFK Connect App",
    publicKey: "",
    user: {
      id:"LFG",
      name: "AFK Wallet User",
      displayName: "AFK Wallet User",
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
  }