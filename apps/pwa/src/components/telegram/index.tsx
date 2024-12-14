'use client';
import {copyToClipboard} from '@/utils/copy';
import {ArgentTMA, SessionAccountInterface} from '@argent/tma-wallet';
import {Button, useToast} from '@chakra-ui/react';
import WebApp from '@twa-dev/sdk';
import {ART_PEACE_ADDRESS} from 'common';
import {useEffect, useMemo, useState} from 'react';
import {CallData, num, RPC} from 'starknet';

//Dummy Tx
export interface ExecuteContractActionOptions {
  feeMultiplier?: number;
  version?: number;
  successMessage?: string;
  errorMessage?: string;
}

export async function executeContractAction(
  account: SessionAccountInterface,
  myCall: any,
  argentTMA: ArgentTMA,
  options: ExecuteContractActionOptions = {},
) {
  const {
    feeMultiplier = 2, // Default to doubling estimated fees
    version = 3,
  } = options;

  try {
    // Estimate fees
    const estimatedFee = await account.estimateInvokeFee([myCall], {version});

    // Create resource bounds, multiplying l1_gas max amount
    const resourceBounds = {
      ...estimatedFee.resourceBounds,
      l1_gas: {
        ...estimatedFee.resourceBounds.l1_gas,
        max_amount: num.toHex(
          BigInt(parseInt(estimatedFee.resourceBounds.l1_gas.max_amount, 16) * feeMultiplier),
        ),
      },
    };

    // Execute the transaction
    const {transaction_hash} = await account.execute(myCall, {
      version,
      maxFee: estimatedFee.suggestedMaxFee,
      feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
      resourceBounds,
    });

    // Wait for transaction and get receipt
    const receipt = await argentTMA.provider.waitForTransaction(transaction_hash);
    console.log('Transaction receipt:', receipt);

    return {
      success: true,
      transaction_hash,
      receipt,
    };
  } catch (error) {
    console.error(`Error performing`, error);

    return {
      success: false,
      error,
    };
  }
}

// Separate configuration for Argent TMA initialization
const ARGENT_CONFIG = {
  environment: 'sepolia',
  appName: 'Hello world',
  appTelegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/afk_aligned_dev_bot',
  sessionParams: {
    allowedMethods: [
      {
        contract:
          process.env.NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS ||
          '0x1c3e2cae24f0f167fb389a7e4c797002c4f0465db29ecf1753ed944c6ae746e',
        selector: 'place_pixel',
      },
      // ... other methods
    ],
    validityDays: 90,
  },
};

// Utility function to initialize Argent TMA
const initArgentTMA = () => {
  if (
    typeof window !== 'undefined' &&
    window.Telegram &&
    WebApp.isActive &&
    WebApp.platform !== 'unknown'
  ) {
    return ArgentTMA.init(ARGENT_CONFIG as any);
  }
  return null;
};

export const TelegramAccount = () => {
  const toast = useToast({
    colorScheme: 'blackAlpha',
    duration: 5000,
    isClosable: true,
    position: 'top-right',
  });
  const argentTMA = useMemo(() => initArgentTMA(), []);
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const [accountTg, setAccount] = useState<SessionAccountInterface | undefined>(() => {
    // Initialize state from localStorage if available
    if (typeof window !== 'undefined') {
      const storedAddress = localStorage.getItem('telegramAccountAddress');
      return storedAddress ? ({address: storedAddress} as SessionAccountInterface) : undefined;
    }
    return undefined;
  });

  const [isConnected, setIsConnected] = useState<boolean>(() => {
    // Initialize connection state based on stored address
    return !!localStorage.getItem('telegramAccountAddress');
  });

  useEffect(() => {
    async function connectArgent() {
      try {
        if (!argentTMA) return;

        const res = await argentTMA.connect();
        if (!res) {
          // Not connected
          setIsConnected(false);
          localStorage.removeItem('telegramAccountAddress');
          return;
        }

        const {account, callbackData} = res;

        if (account.getSessionStatus() !== 'VALID') {
          // Session has expired or scope (allowed methods) has changed
          setAccount(account);
          setIsConnected(false);
          localStorage.removeItem('telegramAccountAddress');
          return;
        }

        // Persist account address
        localStorage.setItem('telegramAccountAddress', account.address);

        setAccount(account);
        setIsConnected(true);

        // Custom data passed to the requestConnection() method is available here
        console.log('callback data:', callbackData);
      } catch (error) {
        console.error('Failed to connect:', error);
        localStorage.removeItem('telegramAccountAddress');
      }
    }

    connectArgent();
  }, []);

  const handleConnectButton = async () => {
    try {
      if (!argentTMA) return;
      // Trigger a connection request
      const resp = await argentTMA.requestConnection('custom_callback_data');
    } catch (error) {
      console.log(error, 'err');
    }
  };

  // Useful for debugging
  const handleClearSessionButton = async () => {
    if (argentTMA) {
      await argentTMA.clearSession();
    }
    // Clear localStorage
    localStorage.removeItem('telegramAccountAddress');
    setAccount(undefined);
    setIsConnected(false);
  };

  //-->Handle Dummy Transaction
  const handleTransaction = async () => {
    setTxLoading(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const pixelCalldata = {
        contractAddress: ART_PEACE_ADDRESS?.['0x534e5f5345504f4c4941'],
        entrypoint: 'place_pixel',
        calldata: CallData.compile({
          position: '1',
          color: '2',
          now: timestamp,
        }),
      };
      if (!accountTg && !argentTMA) return;
      const resp = await executeContractAction(accountTg as any, pixelCalldata, argentTMA as any);

      if (resp.success) {
        setTxHash(`https://sepolia.starkscan.co/tx/${resp?.transaction_hash}`);
        setTxLoading(false);
        toast({
          title: 'Transaction Successful',
          status: 'success',
        });
        return;
      }
      setTxLoading(false);
      toast({
        title: 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } catch (error) {
      setTxLoading(false);
      toast({
        title: 'Something went wrong',
        status: 'error',
      });
    }
  };
  const displayAddress = accountTg ? accountTg.address.slice(0, 8) : '';

  return (
    <div>
      {!isConnected && <Button onClick={handleConnectButton}>Telegram Connect</Button>}

      {isConnected && accountTg && (
        <>
          <p>
            Account address: <code>{displayAddress}</code>
          </p>
          <div className="flex gap-2 pb-2">
            <Button onClick={handleClearSessionButton}>Clear Session</Button>
            <Button disabled={txLoading} onClick={handleTransaction}>
              {txLoading ? 'Transaction in progress' : 'Trigger transaction'}
            </Button>
            {txHash && <Button onClick={() => copyToClipboard(txHash)}>Copy Tx</Button>}
          </div>
        </>
      )}
    </div>
  );
};
