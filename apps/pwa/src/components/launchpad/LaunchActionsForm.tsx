import React, { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { feltToAddress } from 'common';
import { WalletConnectButton } from '../account/WalletConnectButton';
import { useBuyCoin } from '@/hooks/launchpad/useBuyCoin';
import { useSellCoin } from '@/hooks/launchpad/useSellCoin';
import { ButtonSecondary } from '../button/Buttons';
import { useClaimAndDistribute } from '@/hooks/launchpad/useClaimAndDistribute';
import { useUIStore } from '@/store/uiStore';

interface LaunchActionsFormProps {
  launch: any;
  onBuyPress?: (amount: number) => Promise<void>;
  onSellPress?: (amount: number) => Promise<void>;
  userShare?: any;
  loading?: boolean;
  memecoinAddress?: string;
}

export const LaunchActionsForm: React.FC<LaunchActionsFormProps> = ({
  launch,
  onBuyPress,
  onSellPress,
  userShare,
  loading = false,
  memecoinAddress,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [typeAction, setTypeAction] = useState<'BUY' | 'SELL'>('BUY');
  const { account } = useAccount();
  const { handleBuyCoins } = useBuyCoin();
  const { handleSellCoins } = useSellCoin();
  const { handleClaim, handleClaimForFriend } = useClaimAndDistribute();
  const { showToast } = useUIStore();

  const handleClaimToken = async () => {
    console.log('Claiming...');

    const tx = await handleClaim(account?.address, launch?.memecoin_address, 0, undefined);
    if (tx) {
      showToast({
        message: 'Claimed',
        type: "success"
      });
    } else {
      showToast({
        message: 'Error when claiming',
        type: "error"
      });
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleAction = async () => {
    if (!amount || isNaN(Number(amount))) return;

    try {
      if (typeAction === 'BUY' && onBuyPress) {
        // await onBuyPress(Number(amount));
        await handleBuyCoins(
          account?.address,
          memecoinAddress,
          Number(amount),
          launch?.quote_token,
        );
      } else if (typeAction === 'SELL' && onSellPress) {
        // await onSellPress(Number(amount));
        await handleSellCoins(
          account?.address,
          memecoinAddress,
          Number(amount),
          launch?.quote_token,
        );
      }
      // setAmount('');
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const handleMaxAmount = () => {
    if (typeAction === 'SELL' && userShare?.amount_owned) {
      setAmount(userShare.amount_owned.toString());
    }

    if (typeAction === 'BUY') {
      setAmount(launch?.quote_token?.amount_available.toString());
    }
  };

  return (
    <div className="rounded-lg p-6 shadow-sm">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setTypeAction('BUY')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${typeAction === 'BUY'
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTypeAction('SELL')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${typeAction === 'SELL'
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {typeAction === 'SELL' && userShare?.amount_owned && (
              <button
                onClick={handleMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-500 hover:text-blue-600"
              >
                MAX
              </button>
            )}
            {typeAction === 'SELL' && userShare?.amount_owned && (
              <button
                onClick={handleMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-500 hover:text-blue-600"
              >
                MAX
              </button>
            )}
          </div>
        </div>

        {typeAction === 'SELL' && userShare && (
          <div className="text-sm text-gray-500">
            Available: {userShare.amount_owned || '0'}
          </div>
        )}



        {account &&
          <>
            <button
              onClick={handleAction}
              disabled={loading || !amount}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${loading || !amount
                ? 'bg-gray-400 cursor-not-allowed'
                : typeAction === 'BUY'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              ) : (
                `${typeAction} ${launch?.symbol || 'Token'}`
              )}
            </button>
          </>
        }

        {!account && (
          <WalletConnectButton></WalletConnectButton>
        )}

        {launch?.is_liquidity_added &&
          <div>
            <ButtonSecondary onClick={() => handleClaimToken()}>Claim Token</ButtonSecondary>
          </div>
        }

      </div>



    </div>
  );
}; 