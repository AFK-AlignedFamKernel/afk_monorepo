import React from 'react';
import {ScrollView, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';

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
  useDefaultStyles?: boolean;
}

const TabSelector: React.FC<ITabSelector> = ({
  activeTab,
  handleActiveTab,
  buttons,
  addScreenNavigation = true,
  containerStyle,
  tabStyle,
  activeTabStyle,
  useDefaultStyles = true,
}) => {
  const {theme} = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    scrollContent: {
      paddingHorizontal: 16,
    },
    tab: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginHorizontal: 4,
      borderRadius: 20,
      backgroundColor: 'transparent',
    },
    active: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
  });

  const handlePress = (tab: string | any, screen?: string) => {
    if (addScreenNavigation) {
      handleActiveTab(tab, screen);
    } else {
      handleActiveTab(tab);
    }
  };

  return (
    <View style={useDefaultStyles ? dynamicStyles.container : null}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={useDefaultStyles ? dynamicStyles.scrollContent : containerStyle}
      >
        {buttons?.map((b, i) => (
          <Button
            key={i}
            style={[
              useDefaultStyles ? dynamicStyles.tab : tabStyle,
              activeTab === b?.tab
                ? useDefaultStyles
                  ? dynamicStyles.active
                  : activeTabStyle
                : null,
            ]}
            textStyle={[
              useDefaultStyles ? dynamicStyles.tabText : null,
              activeTab === b?.tab && useDefaultStyles ? dynamicStyles.activeTabText : null,
            ]}
            onPress={() => handlePress(b?.tab, b?.screen)}
          >
            {b?.title}
          </Button>
        ))}
      </ScrollView>
    </View>
  );
};

export default TabSelector;
