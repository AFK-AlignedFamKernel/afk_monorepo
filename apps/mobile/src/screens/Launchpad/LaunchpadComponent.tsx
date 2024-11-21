import { useAccount } from '@starknet-react/core';
import { useAuth } from 'afk_nostr_sdk';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

import { Button } from '../../components';
import Loading from '../../components/Loading';
import { TokenLaunchCard } from '../../components/search/TokenLaunchCard';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import { useTokenCreatedModal } from '../../hooks/modals/useTokenCreateModal';
import { useCombinedTokenData } from '../../hooks/useCombinedTokens';
import { FormLaunchToken } from '../../modules/LaunchTokenPump/FormLaunchToken';
import { useLaunchpadStore } from '../../store/launchpad';
import stylesheet from './styles';

interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
}
export const LaunchpadComponent: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const account = useAccount();
  const { tokens, isLoading, isFetching } = useCombinedTokenData();
  const { show: showModal } = useTokenCreatedModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const { publicKey } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024 ? true : false;
  const { tokens: tokensStore, setTokens, setLaunchs, launchs } = useLaunchpadStore();

  const [tokenOrLaunch, setTokenOrLauch] = useState<'TOKEN' | 'LAUNCH'>('LAUNCH')

  useEffect(() => {
    if (tokens?.length != tokensStore?.length) {
      setTokens(tokens);
      setLaunchs(tokens);
    }

    console.log('tokens', tokens);
    console.log('tokensStore', tokensStore);
  }, [tokens, tokensStore]);
  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator></ActivityIndicator>}

      {isButtonInstantiateEnable && (
        <Button
          onPress={() => {
            showModal();
          }}
        >
          <Text>Create token</Text>
        </Button>
      )}
      {menuOpen && <FormLaunchToken />}


      <View style={styles.actionToggle}>
        <Button
          style={[styles.toggleButton, styles.activeToggle]}
          onPress={() => setTokenOrLauch("LAUNCH")}          >
          Launchs
        </Button>
        <Button
          style={[styles.toggleButton, styles.activeToggle]}
          onPress={() => setTokenOrLauch("TOKEN")}

        >
          Tokens
        </Button>

      </View>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          contentContainerStyle={styles.flatListContent}
          data={tokens}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item, i) => i.toString()}
          key={`flatlist-${isDesktop ? 3 : 1}`}
          numColumns={isDesktop ? 3 : 1}
          renderItem={({ item, index }) => {
            return <TokenLaunchCard key={index} token={item} />;
          }}
          refreshControl={<RefreshControl refreshing={isFetching} />}
        />
      )}
    </View>
  );
};
