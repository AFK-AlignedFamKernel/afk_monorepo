import React from 'react';
import {ScrollView, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';

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
                tabStyle ?? styles.tab,
                activeTab === b?.tab ? activeTabStyle ?? styles.active : null,
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
  tabContainer: {
    height: 50, // Set a fixed height for the tab container
    backgroundColor: '#f0f0f0', // Optional: background color for the entire tab bar
  },
  container: {
    alignItems: 'center', // Ensure the tabs are vertically centered
    paddingVertical: 5,
    flexDirection: 'row',
  },

  tab: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    // padding: 10,
  },
  active: {
    borderBottomWidth: 2,
    borderColor: 'blue',
  },
});

export default TabSelector;
