import { useState } from 'react';
import { KeyboardAvoidingView, View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextButton } from '../../components';
import TabSelector from '../../components/TabSelector';
import { useStyles, useTheme } from '../../hooks';
import { GameSreenProps } from '../../types';
import { SelectedTab, TABS_MENU } from '../../types/tab';
import stylesheet from './styles';
import { AllKeysComponent } from '../KeysMarketplace/AllKeysComponent';
import EmbedWebsite from '../../components/Embed';
import EmbedCard from '../../components/Embed';


export const ECOSYSTEM_INTEGRATION = {
  raize: {
    uri: "https://www.raize.club",
    twitter: "",
  },
  ekubo: {
    uri: "https://app.ekubo.org/",
    twitter: "",
  },
}
export const SlinksMap: React.FC = () => {
  const theme = useTheme()
  const styles = useStyles(stylesheet);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.content}>

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>
        <FlatList
          // contentContainerStyle={styles.stories}
          // horizontal
          data={Object.values(ECOSYSTEM_INTEGRATION)}
          showsHorizontalScrollIndicator={false}
          // data={stories}
          // ItemSeparatorComponent={() => <View style={styles.storySeparator} />}
          renderItem={({ item }) => {
            console.log("item", item)
            return (
              // <EmbedWebsite uri={item[0]}></EmbedWebsite>
              <EmbedCard
                key={item?.uri} uri={item.uri}
              >
              </EmbedCard>
              // <EmbedWebsite ></EmbedWebsite>

              // <BubbleUser
              //   // name={item.name}
              //   // image={item.img}
              //   event={item}
              // />
            )
          }}
        />

        {/* {Object.fromEntries(ECOSYSTEM_INTEGRATION).map()} */}
        {/* {Object.entries(ECOSYSTEM_INTEGRATION).map((e) => {
            return(
              <EmbedWebsite uri={e?.[0]}></EmbedWebsite>
            )
          })} */}

        {/* <EmbedWebsite uri={"https://www.raize.club"}></EmbedWebsite> */}

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
