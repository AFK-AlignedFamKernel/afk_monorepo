import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useAuth, useProfile } from 'afk_nostr_sdk';
import { useQueryAllCoins } from '../../../hooks/launchpad/useQueryAllCoins';
import { useStyles, useTheme } from '../../../hooks';
import stylesheet from './styles';
import { TokenLaunchDetail } from '../../../components/pump/TokenLaunchDetail';
import { TokenLaunchInterface } from '../../../types/keys';

const tabs = ['Trending', "New", 'Quests'];

const RightSidebar = () => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const publicKey = useAuth((state) => state.publicKey);
  const { data: profile } = useProfile({ publicKey });

  const { data: coins, isLoading, error } = useQueryAllCoins();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderListItem = ({ item }: { item: TokenLaunchInterface }) => (
    <View style={styles.itemContainer}>
      <TokenLaunchDetail launch={item} isViewDetailDisabled={true} isDisabledInfo={true} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View>
        {activeTab === 'Trending' && (
          <>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.text} />
            ) : error ? (
              <Text style={{ color: theme.colors.text }}>Failed to load coins</Text>
            ) : (
              <FlatList
                data={coins}
                renderItem={renderListItem}
                keyExtractor={(item) => item.token_address.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={<Text style={{ color: theme.colors.text }}>No coins available</Text>}
                ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              />
            )}
          </>
        )}

        {activeTab === 'New' && (
          <>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.text} />
            ) : error ? (
              <Text style={{ color: theme.colors.text }}>Failed to load coins</Text>
            ) : (
              <FlatList
                data={coins}
                renderItem={renderListItem}
                keyExtractor={(item) => item.token_address.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={<Text style={{ color: theme.colors.text }}>No coins available</Text>}
                ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              />
            )}
          </>
        )}
        {activeTab === 'Quests' && (
          <>
            <Text>Questing coming soon</Text>
            {profile ? (
              <Text style={{ color: theme.colors.text }}>NIP05: {profile.nip05}</Text>
            ) : (
              <Text style={{ color: theme.colors.text }}>...</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default RightSidebar;
