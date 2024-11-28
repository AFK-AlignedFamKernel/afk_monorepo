import {
  Account,
  RpcProvider,
  TypedData,
  WeierstrassSignatureType,
} from "starknet";

import { NODE_URL, SN_CHAIN_ID } from "../../constants/contracts";

export class SignatureService {
  private provider: RpcProvider;

  constructor(nodeUrl?: string) {
    this.provider = new RpcProvider({
      nodeUrl: NODE_URL,
      chainId: SN_CHAIN_ID,
    });
  }

  /**
   * Todo: Make this work as expected
   * Verify signature on-chain using the account contract
   */
  public async verifySignature({
    accountAddress,
    signature,
    signedData,
  }: {
    signature: WeierstrassSignatureType;
    accountAddress: string;
    signedData: TypedData;
  }) {
    try {
      const formattedSignature = {
        r: BigInt(signature.r),
        s: BigInt(signature.s),
      } as WeierstrassSignatureType;


      

      // Using dummy private key since we only need it for interface compatibility
      // This won't affect verification as we're only using public methods
      const dummyPrivateKey = "0x1";
      const account = new Account(
        this.provider,
        accountAddress,
        dummyPrivateKey
      );

      return await account.verifyMessage(signedData, formattedSignature);
    } catch (error) {
      console.log("verification failed:", error);
      throw Error("Error:" + error);
    }
  }
}
