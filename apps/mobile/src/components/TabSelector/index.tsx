import React from 'react';
import {ScrollView, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {Spacing} from '../../styles';
import {useTheme} from '../../hooks';

import {Button} from '../Button';

interface ITabSelector {
  handleActiveTab: (tab: string | any, screen?: string) => void;
  activeTab: string | any;
  buttons?: {tab: any | string; title?: string; screen?: string}[];
  addScreenNavigation?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  activeTabStyle?: StyleProp<ViewStyle>;
}

const TabSelector: React.FC<ITabSelector> = ({
  activeTab,
  handleActiveTab,
  buttons,
  addScreenNavigation = true,
  containerStyle,
  tabStyle,
  activeTabStyle,
}) => {
  const {theme} = useTheme();

  const dynamicStyles = StyleSheet.create({
    tabContainer: {
      height: 50,
      backgroundColor: theme.colors.surface,
    },
    active: {
      borderBottomWidth: 2,
      borderColor: theme.colors.primary,
    },
    tabText: {
      color: theme.colors.text,
    },
    activeTabText: {
      color: theme.colors.primary,
    }
  });

  const handlePress = (tab: string | any, screen?: string) => {
    if (addScreenNavigation) {
      handleActiveTab(tab, screen);
    } else {
      handleActiveTab(tab);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={containerStyle ?? styles.container}
      >
        {buttons?.map((b, i) => {
          return (
            <Button
              key={i}
              style={[
                styles.tab,
                tabStyle,
                activeTab === b?.tab ? activeTabStyle ?? dynamicStyles.active : null,
              ]}
              onPress={() => handlePress(b?.tab, b?.screen)}
            >
              {b?.title}
            </Button>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 5,
    flexDirection: 'row',
  },
  tab: {
    height: '100%',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.small,
  },
  button: {
    padding: Spacing.xsmall,
  },
});

export default TabSelector;
