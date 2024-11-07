import { useState } from 'react';
import { View } from 'react-native';

import { useStyles } from '../../hooks';
import { Button } from '../Button';
import { Input } from '../Input';
import { Text } from '../Text';
import stylesheet from './styles';
import { useBalanceUtil } from '../../starknet/evm/utilHook';
import { useAccount } from '@starknet-react/core';
import { LaunchDataMerged, TokenLaunchInterface, UserShareInterface } from '../../types/keys';
import { useWalletModal } from '../../hooks/modals';

export type LaunchActionsFormProps = {
  onBuyPress: () => void;
  onSellPress: () => void;
  onHandleAction: (amountProps?: number) => void;
  onChangeText: (e: any) => void;
  onSetAmount: (e: number) => void;
  typeAction?: "BUY" | "SELL";
  setTypeAction?: (type: "BUY" | "SELL") => void;
  launch?: LaunchDataMerged;
  amount?: number;
  userShare?: UserShareInterface
};

enum AmountType {
  QUOTE_AMOUNT,
  COIN_AMOUNT_TO_BUY,
}
export const LaunchActionsForm: React.FC<LaunchActionsFormProps> = ({
  launch,
  amount,
  userShare,
  setTypeAction,
  typeAction,
  onBuyPress,
  onSellPress,
  onHandleAction,
  onChangeText,
  onSetAmount
}) => {
  const styles = useStyles(stylesheet);
  const walletModal = useWalletModal();

  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();
      // const result = await waitConnection();
      // if (!result) return;
    }
  };

  const account = useAccount()
  const [isActive, setIsActive] = useState(false);

  const [typeAmount, setTypeAmount] = useState<AmountType>(AmountType.QUOTE_AMOUNT);

  const { data: toBalance, } = useBalanceUtil({
    address: account?.address,
    token: launch?.quote_token,
  });

  console.log("toBalance", toBalance)
  console.log("userShare", userShare)
  return (
    <View style={styles.container}>

      <View
        style={{ display: "flex", flexDirection: "row" }}
      >
        <Button onPress={() => setTypeAction && setTypeAction("BUY")} style={{ backgroundColor: 'green', width: 'auto', flexGrow: 1 }}>
          <Text>Buy</Text>
        </Button>

        <Button onPress={() => setTypeAction && setTypeAction("SELL")} style={{ backgroundColor: 'red', width: 'auto', flexGrow: 1 }}>
          <Text>Sell</Text>
        </Button>
      </View>

      <View
      // style={{ display: "flex", flex: 1, flexDirection: "row" }}
      >
        <Input
          keyboardType="decimal-pad"
          // keyboardType=
          // value={amount ? String(amount) : "0"}
          style={{ borderColor: isActive ? '#A1A1C7' : '#000', marginTop: 15, width: "85%" }}
          // onFocus={() => setIsActive(true)}
          // onBlur={() => setIsActive(false)}
          onChangeText={(e) => {
            if(e && !isNaN(Number(e))) {
              onChangeText(e)
            }
          }}
          placeholder="Amount"
          value={Number(amount).toString()}
          
        />

        {(typeAction == "BUY" || !typeAction) ?
          <>
            {toBalance ?
              <Button
                style={{ width: "auto" }}
                onPress={() => {
                  let formatedBalance = Number(toBalance?.formatted)
                  // setTypeAmount(formatedBalance)
                  onSetAmount(formatedBalance)


                }}
              >
                <Text>
                  {toBalance?.formatted}
                </Text>
              </Button>
              :
              <Button
                style={{ width: "auto" }}
              >
                <Text>
                  Balance not found
                </Text>
              </Button>
            }
          </>
          : <>
            <Button
              style={{ width: "auto" }}
              onPress={() => {
                let remainTotal = Number(userShare?.total_buy) - Number(userShare?.total_sell)
                // setTypeAmount(remainTotal)
                onSetAmount(remainTotal)

              }}
            >
              {userShare ?
                <Text


                >
                  {Number(userShare?.total_buy) - Number(userShare?.total_sell)}
                </Text>
                : <>
                  <Text>Share not found</Text></>
              }
            </Button>
          </>
        }

      </View>

      <View
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          gap: 3,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >


        {!account?.address &&

          <Button onPress={() => {
            const handleConnect = async () => {
              await onConnect();

              if (!account || !account?.account) return;

            }
            handleConnect()
          }}>Connect</Button>
        }
        <Button onPress={() => onHandleAction()} style={{ backgroundColor: (typeAction == "BUY" || !typeAction) ? 'green' : "red", flexGrow: 1 }}>
          <Text>{typeAction ?? "BUY"}</Text>
        </Button>


        {/* <Button onPress={onBuyPress} style={{ backgroundColor: 'green', width: 'auto', flexGrow: 1 }}>
          <Text>Buy</Text>
        </Button>

        <Button onPress={onSellPress} style={{ backgroundColor: 'red', width: 'auto', flexGrow: 1 }}>
          Sell
        </Button> */}
      </View>
    </View >
  );
};
