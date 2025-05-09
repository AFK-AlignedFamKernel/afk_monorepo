import { NextResponse } from 'next/server';
import { Account, constants, Provider } from 'starknet';

export async function POST(request: Request) {
  try {
    const { deployCall, address } = await request.json();

    if (!deployCall || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const provider = new Provider({
      sequencer: {
        network: constants.StarknetChainId.SN_SEPOLIA,
      },
    });

    const account = new Account(
      provider,
      address,
      process.env.STARKNET_PRIVATE_KEY
    );

    const tx = await account.execute(deployCall);
    const receipt = await account.waitForTransaction(tx.transaction_hash);

    return NextResponse.json({
      transactionHash: tx.transaction_hash,
      receipt,
    });
  } catch (error) {
    console.error('Error deploying token:', error);
    return NextResponse.json(
      { error: 'Failed to deploy token' },
      { status: 500 }
    );
  }
} 