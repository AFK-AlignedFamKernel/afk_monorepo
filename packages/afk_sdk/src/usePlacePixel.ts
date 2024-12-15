import { useMutation } from '@tanstack/react-query';
import { Account, num, RPC } from 'starknet';

// Detect Telegram context
const isTelegramContext = () =>
  typeof window !== 'undefined' &&
  // @ts-ignore
  window.Telegram &&
  // @ts-ignore
  window.Telegram.WebApp.isActive &&
  // @ts-ignore
  window.Telegram.WebApp.platform !== 'unknown';

// Enum for context types
export enum ContractActionContextType {
  Expo = 'expo',
  Telegram = 'telegram',
}

// Contract call interface
export interface ContractCallProps {
  contractAddress: any;
  method: string;
  calldata: any[];
  feeMultiplier?: number;
}

// Common types
export interface ExecuteContractActionOptions {
  version?: number;
  contextType?: ContractActionContextType.Expo | ContractActionContextType.Telegram;
  argentTMA?: any;
}

interface ExecuteContractActionResult {
  transaction_hash?: string;
  receipt?: any;
}

// Main execution function (can be used outside of hook if needed)
export const executeContractAction = async ({
  account,
  callProps,
  options = {},
}: {
  account: any;
  callProps: ContractCallProps;
  options: ExecuteContractActionOptions;
}): Promise<ExecuteContractActionResult> => {
  const { version = 3, argentTMA } = options;

  // Automatically determine the context type
  const contextType = isTelegramContext()
    ? ContractActionContextType.Telegram
    : ContractActionContextType.Expo;

  // Prepare the call for execution
  const myCall = {
    contractAddress: callProps.contractAddress,
    entrypoint: callProps.method,
    calldata: callProps.calldata,
  };

  try {
    // Estimate fees (same for both contexts)
    const estimatedFee = await account.estimateInvokeFee([myCall], { version });

    // Apply fee multiplier (default to 1.5x if not specified)
    const feeMultiplier = callProps.feeMultiplier || 1.5;
    const maxFee =
      (estimatedFee.suggestedMaxFee * BigInt(Math.round(feeMultiplier * 10))) / BigInt(10);

    // Prepare transaction options based on context
    const transactionOptions =
      contextType === ContractActionContextType.Telegram
        ? {
            version,
            maxFee,
            feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
            resourceBounds: {
              ...estimatedFee.resourceBounds,
              l1_gas: {
                ...estimatedFee.resourceBounds.l1_gas,
                max_amount: num.toHex(
                  BigInt(parseInt(estimatedFee.resourceBounds.l1_gas.max_amount, 16) * 2),
                ),
              },
            },
          }
        : {
            version,
            maxFee,
          };

    // Execute the transaction using account.execute()
    const { transaction_hash } = await account.execute(myCall, transactionOptions);

    // Wait for transaction receipt
    let receipt;
    if (contextType === ContractActionContextType.Telegram) {
      if (!argentTMA) {
        throw new Error('ArgentTMA is required for Telegram context');
      }
      receipt = await argentTMA.provider.waitForTransaction(transaction_hash);
    } else {
      receipt = await (account as Account).waitForTransaction(transaction_hash);
    }

    return {
      transaction_hash,
      receipt,
    };
  } catch (error) {
    return Promise.reject(error);
  }
};

// Hook using Tanstack Query
export const useContractAction = () => {
  return useMutation({
    mutationFn: executeContractAction,
  });
};
