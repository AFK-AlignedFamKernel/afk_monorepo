'use client';
import { useState } from 'react';
import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { useNamespace, useDepositRewards, useVoteTip, useScoreContractFactoryData, useGetSubInfo } from '@/hooks/infofi';
import { useAccount } from '@starknet-react/core';
import { WalletConnectButton } from '@/components/account/WalletConnectButton';
import { SubInfo, Epoch, UserProfile } from '@/types/infofi';
import { SubUserCard } from './SubUserCard';


interface SubPageProps {
  subInfo: SubInfo;
  onPress?: () => void;
  isButtonInstantiateEnable?: boolean;
}

export const SubPage: React.FC<SubPageProps> = ({
  subInfo,
  onPress,
  isButtonInstantiateEnable = true,
}) => {

  const [amount, setAmount] = useState<string>('');
  const [nostrAddress, setNostrAddress] = useState<string>('');
  const { handleLinkNamespaceScoring, isLinkingNamespace } = useNamespace();
  const { handleDepositRewards, isDepositing } = useDepositRewards();
  const { account, address } = useAccount();

  const [isViewProfile, setIsViewProfile] = useState<boolean>(false);

  const { data: subDetailsData, isLoading: isLoadingDetails, isError: isErrorDetails, refetch: refetchDetails } = useGetSubInfo(subInfo?.contract_address);

  // console.log("subDetailsData", subDetailsData);
  // console.log("subProfiles", subProfiles);
  // console.log("subEpochs", subEpochs);
  // console.log("subAggregations", subAggregations);

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  const handleClick = () => {
    if (onPress) {
      onPress();
    }
  };


  const handleSubscription = async () => {
    try {
      await handleLinkNamespaceScoring(subInfo?.contract_address);
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  const handleDeposit = async () => {
    try {
      await handleDepositRewards({
        nostr_address: nostrAddress,
        vote: 'good',
        is_upvote: true,
        upvote_amount: amount,
        downvote_amount: '0',
        amount: amount,
        amount_token: amount,
      },
        subInfo?.contract_address
      );
      setAmount('');
      setNostrAddress('');
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  // console.log("subInfo", subInfo);
  return (
    <div
      className={styles.afkSubCard}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div>
        <h3 className={styles.subCardTitle}>
          {subInfo?.name}
        </h3>
        <span className={styles.subCardTag}>
          {subInfo?.main_tag}
        </span>
        <p className="mt-2 text-sm">
          {subInfo?.about}
        </p>
      </div>

      <div className="mt-4">
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Total Deposits</span>
          <div className={styles.overviewValue}>
            {formatDecimal(subInfo.total_amount_deposit)}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap">
        {subInfo.contract_address}
      </div>


      <div className={styles.epochSection}>
        <div className={styles.epochScroll}>
          {subDetailsData?.epochs?.map((epoch: Epoch) => {
            return (
              <div key={epoch.id} className={styles.epochCard}>
                <h4 className={styles.epochCardTitle}>Epoch {epoch.epoch_index}</h4>
                <div className={styles.epochStats}>
                  <div className={styles.epochStat}>
                    <div className={styles.epochStat}>
                      <span className={styles.epochStatLabel}>Amount Deposited</span>
                      <div className={styles.epochStatValue}>
                        {formatDecimal(epoch.total_amount_deposit)}
                      </div>
                    </div>
                    <span className={styles.epochStatLabel}>AI Score</span>
                    <div className={styles.epochStatValue}>
                      {formatDecimal(epoch.total_ai_score)}
                    </div>
                  </div>
                  <div className={styles.epochStat}>
                    <span className={styles.epochStatLabel}>Vote Score</span>
                    <div className={styles.epochStatValue}>
                      {formatDecimal(epoch.total_vote_score)}
                    </div>
                  </div>
                  <div className={styles.epochStat}>
                    <span className={styles.epochStatLabel}>Vote Score</span>
                    <div className={styles.epochStatValue}>
                      {formatDecimal(epoch.total_vote_score)}
                    </div>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      </div>
      {isButtonInstantiateEnable && (
        <button
          onClick={handleSubscription}
          className={styles.subscribeButton}
          disabled={isLinkingNamespace}
        >
          {isLinkingNamespace ? 'Subscribing...' : 'Subscribe to InfoFi'}
        </button>
      )}

      <div>
        <button onClick={() => setIsViewProfile(!isViewProfile)}>
          {isViewProfile ? 'Hide Profile' : 'View Profile'}
        </button>

        {isViewProfile && (
          <div>
            <h3 className={styles.epochTitle}>Profile</h3>
            {subDetailsData?.profiles?.map((profile: UserProfile, index: number) => {
              return (
                <SubUserCard profile={profile} key={index} contractAddress={subInfo?.contract_address} />
              )
            })}
          </div>
        )}
      </div>



      <div className={styles.depositSection}>
        <h3 className={styles.epochTitle}>Deposit Rewards</h3>
        <div className={styles.depositContainer}>
          <input
            type="number"
            placeholder="Amount to deposit"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.depositInput}
          />
          <input
            type="text"
            placeholder="Nostr Address"
            value={nostrAddress}
            onChange={(e) => setNostrAddress(e.target.value)}
            className={styles.depositInput}
          />

          {address ?
            <button
              onClick={handleDeposit}
              className={styles.depositButton}
              disabled={isDepositing || !amount}
            >
              {isDepositing ? 'Depositing...' : 'Deposit Rewards'}
            </button>

            : <WalletConnectButton />
          }
        </div>
      </div>
    </div>
  );
}; 