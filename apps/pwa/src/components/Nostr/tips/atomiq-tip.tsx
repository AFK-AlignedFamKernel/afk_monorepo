import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useAccount } from '@starknet-react/core';
import { useLN, useProfile } from 'afk_nostr_sdk';
import React, { useState } from 'react';
import { CallData, uint256 } from 'starknet';
import { useAtomiqLab } from '@/hooks/atomiqlab';
import { useUIStore } from '@/store/uiStore';
import { TokenSymbol } from 'common';
import Image from 'next/image';

interface TipSuccessModalProps {

}
export type FormAtomiqProps = {
  event?: NDKEvent;
  profile?: NDKUserProfile;
  show: (event: NDKEvent) => void;
  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const FormTipAtomiq: React.FC<FormAtomiqProps> = ({
  event,
  hide: hideTipModal,
  showSuccess,
  hideSuccess,
  profile: profileUser
}: FormAtomiqProps) => {
  const [token, setToken] = useState<TokenSymbol>(TokenSymbol.STRK);
  const [amount, setAmount] = useState<string>('');
  const { handleZap, getInvoiceFromLnAddress, payInvoice } = useLN();

  const { data: profile } = useProfile({ publicKey: event?.pubkey });

  const { showToast } = useUIStore();
  const account = useAccount();
  const [successAction, setSuccessAction] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<any | null>(null);
  const [successUrl, setSuccessUrl] = useState<any | null>(null);
  const [preimage, setPreimage] = useState<string | null>(null);
  const { handlePayInvoice, handleConnect, handlePayLnurl, starknetSwapper } = useAtomiqLab();
  const [isLoading, setIsLoading] = useState(false);

  const isActive = !!amount && !!token;

  const onTipPress = async () => {
    try {

      // return showToast({ message: "Will be implemented soon", type: 'error' });
      if (!profile?.lud16) {
        showToast({ message: "No LUD16 found", type: 'error' });
        return;
      }

      if (!amount) {
        showToast({ message: "No amount found", type: 'error' });
        return;
      }
      setIsLoading(true);

      const invoice = await getInvoiceFromLnAddress(profile?.lud16, Number(amount));

      if (!invoice?.paymentRequest) {
        showToast({ message: "Invoice not found", type: 'error' });
        return;
      }

      showToast({ message: "Paying invoice in process", type: 'info' });

      const res = await handlePayLnurl(profile?.lud16, Number(amount));

      if (res.success && res?.lightningSecret) {
        setPreimage(res.lightningSecret);
        setSuccessAction(res.successAction);
        setSuccessUrl(res.successUrl);

        showToast({
          message: "Tip sent",
          type: "success"
        });
      }
    } catch (error) {
      showToast({
        message: "Error",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (profile && !profile?.lud16) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <p className="text-sm text-gray-500">
            No LUD16 found
          </p>
          <p className="text-sm text-gray-500">Ask the user to set a LUD16</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center space-x-4 text-left">
          {/* <Image height={48} src="/assets/afk-logo.png" /> */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 truncate cursor-pointer"

              onClick={() => {
                if (event?.pubkey) {
                  navigator.clipboard.writeText(event?.pubkey);
                  showToast({ message: "LUD16 copied to clipboard", type: 'success' });
                }
              }}
            >
              {profile?.displayName ?? profile?.name ?? profileUser?.displayName ?? profileUser?.name ?? event?.pubkey?.slice(0, 6) + "..." + event?.pubkey?.slice(-4)}
            </h3>
            {profile?.nip05 && (
              <p className="text-sm text-gray-500">
                @{profile?.nip05}
              </p>
            )}

            {profile?.lud16 ? (
              <p className="text-sm text-gray-500 cursor-pointer"
                onClick={() => {
                  if (profile?.lud16) {
                    navigator.clipboard.writeText(profile?.lud16);
                    showToast({ message: "LUD16 copied to clipboard", type: 'success' });
                  }
                }}
              >
                {profile?.lud16}
              </p>
            ): profileUser?.lud16 ? ( 
              <p className="text-sm text-gray-500 cursor-pointer"
                onClick={() => {
                  if (profileUser?.lud16) {
                    navigator.clipboard.writeText(profileUser?.lud16);
                    showToast({ message: "LUD16 copied to clipboard", type: 'success' });
                  }
                }}
              >
                {profileUser?.lud16}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                No LUD16 found
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-700 line-clamp-1">
          {event?.content}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          {token === TokenSymbol.STRK && (
            <span className="text-sm font-medium text-gray-700">
              STRK
            </span>
          )}
        </div>

        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in SATS"
          className="w-full"
        />
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Sending</span>
          <span className="font-bold text-primary">
            {amount.length > 0 ? `${amount} SATs` : '...'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-gray-600">to</span>
          <span className="font-medium truncate">
            {(profile?.nip05 && `@${profile.nip05}`) ??
              profile?.displayName ??
              profile?.name ??
              profileUser?.displayName ??
              profileUser?.name ??
              event?.pubkey}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <button
          // variant="secondary"
          disabled={!isActive || isLoading}
          onClick={onTipPress}
          className="w-full btn btn-primary"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            "Tip"
          )}
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500 text-center">
        Tip friends and support creators with your favorite tokens.
      </p>
    </div>
  );
};
