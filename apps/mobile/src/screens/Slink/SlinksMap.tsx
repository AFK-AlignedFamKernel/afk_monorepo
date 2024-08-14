import { KeyboardAvoidingView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Divider } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import stylesheet from './styles';
import EmbedCard from '../../components/Embed';

export const ECOSYSTEM_INTEGRATION = {
  raize: {
    title:"Raize",
    uri: "https://www.raize.club",
    twitter: "",
    description:"Prediction Market"
  },
  ekubo: {
    uri: "https://app.ekubo.org/",
    title:"Ekubo",
    twitter: "",
    description:"DEX on Starknet"

  },
}
export const SlinksMap: React.FC = () => {
  const theme = useTheme()
  const styles = useStyles(stylesheet);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.content}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>
        <FlatList
          data={Object.values(ECOSYSTEM_INTEGRATION)}
          showsHorizontalScrollIndicator={false}
          // data={stories}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => {
            // console.log("item", item)
            return (
              <EmbedCard
                key={item?.uri} uri={item.uri}
                title={item?.title}
              description={item?.description}
              >
              </EmbedCard>
           
            )
          }}
        />

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
