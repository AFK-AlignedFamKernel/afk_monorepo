import {useAccount} from '@starknet-react/core';
import {useAuth} from 'afk_nostr_sdk';
import {useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, Text, View} from 'react-native';
import {Button} from '../../components';
import {TokenLaunchCard} from '../../components/search/TokenLaunchCard';
import {useStyles, useTheme, useWindowDimensions} from '../../hooks';
import {useQueryAllLaunch} from '../../hooks/launchpad/useQueryAllLaunch';
import {useKeyModal} from '../../hooks/modals/useKeyModal';
import {useTokenCreatedModal} from '../../hooks/modals/useTokenCreateModal';
import {FormLaunchToken} from '../../modules/LaunchTokenPump/FormLaunchToken';
import stylesheet from './styles';
import Loading from '../../components/Loading';
import {useCombinedTokenData} from '../../hooks/useCombinedTokens';

interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
}
export const LaunchpadComponent: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const account = useAccount();
  const {tokens, isLoading, isFetching} = useCombinedTokenData();
  const {show: showModal} = useTokenCreatedModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const {publicKey} = useAuth();
  const {width} = useWindowDimensions();
  const isDesktop = width >= 1024 ? true : false;

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
          renderItem={({item, index}) => {
            return <TokenLaunchCard key={index} token={item} />;
          }}
          refreshControl={<RefreshControl refreshing={isFetching} />}
        />
      )}
    </View>
  );
};
