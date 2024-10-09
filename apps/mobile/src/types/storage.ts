
export interface GeneratePasskeyValues {
    secretKey: string,
    // publicKey: string,
    nameChallenge?: string,
    nameRp?: string,
    publicKey?: string,
    user?: {
      id?: string;
      name?: string;
      displayName?: string;
    },
  }