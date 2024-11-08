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
    <View style={[dynamicStyles.container, containerStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        {buttons?.map((b, i) => (
          <Button
            key={i}
            style={[
              dynamicStyles.tab,
              tabStyle,
              activeTab === b?.tab ? [dynamicStyles.active, activeTabStyle] : null,
            ]}
            textStyle={[
              dynamicStyles.tabText,
              activeTab === b?.tab ? dynamicStyles.activeTabText : null
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
