import {Box, Button, ResponsiveValue} from '@chakra-ui/react';
import {ConnectButton} from '@rainbow-me/rainbowkit';
// import {ConnectButtonProps} from '@rainbow-me/rainbowkit/dist/components/ConnectButton/ConnectButton';
type AccountStatus = 'full' | 'avatar' | 'address';
type ChainStatus = 'full' | 'icon' | 'name' | 'none';
export interface ConnectButtonProps {
  accountStatus?: ResponsiveValue<AccountStatus>;
  showBalance?: ResponsiveValue<boolean>;
  chainStatus?: ResponsiveValue<ChainStatus>;
  label?: string;
}
interface ICustomConnectButtonWallet extends ConnectButtonProps {
  isHiddenBalance?: boolean;
  isHiddenNetwork?: boolean;
  isHiddenAddress?: boolean;

  isViewBalance?: boolean;
  isViewAddress?: boolean;
  isViewNetwork?: boolean;
  isViewAccount?: boolean;
}
export const CustomConnectButtonWallet: React.FC<ICustomConnectButtonWallet> = (props) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');
        return (
          <Box
            w={'100%'}
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    type="button"
                    // bg={{ base: "green.300" }}
                    bg={{base: 'brand.primary'}}
                    width={'100%'}
                  >
                    Connect EVM
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} type="button" width={'100%'}>
                    Wrong network
                  </Button>
                );
              }
              return (
                <Box
                  gap={{base: '0.5em', md: '1em'}}
                  display={{base: 'grid', md: 'flex'}}
                  // style={{
                  //   // display: "flex",
                  //   gap: 8,
                  //   // justifyContent:"center" ,
                  // }}
                >
                  {!props?.isHiddenNetwork && (
                    <Button
                      onClick={openChainModal}
                      style={{display: 'flex', alignItems: 'center'}}
                      type="button"
                      width={'100%'}
                      p="1em"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{width: 12, height: 12}}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </Button>
                  )}

                  {!props?.isHiddenAddress && (
                    <Button
                      p="0.3em"
                      onClick={openAccountModal}
                      type="button"
                      width={'100%'}
                      textIndent={'inherit'}
                    >
                      {account.displayName}
                      {props?.isViewBalance && account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </Button>
                  )}

                  {/* {props?.isViewBalance && (
                    <Button
                      p="0.3em"
                      onClick={openAccountModal}
                      type="button"
                      width={"100%"}
                      textIndent={"inherit"}
                    >
                      { account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ""}
                    </Button>
                  )} */}

                  {/* <Button
                    p='0.3em'

                   onClick={openAccountModal} type="button"
                    width={"100%"}
                    textIndent={"inherit"}
                    >
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ""}
                  </Button> */}
                </Box>
              );
            })()}
          </Box>
        );
      }}
    </ConnectButton.Custom>
  );
};
