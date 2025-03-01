import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';
import { IconButton } from '../../components';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import { PixelPeace } from '../../modules/PixelPeace';
import { PixelScreenProps } from '../../types';
import { SelectedTab } from '../../types/tab';
import stylesheet from './styles';

export const PixelScreen: React.FC<PixelScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.PIXEL_PEACE);

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  const handleTabSelected = (
    tab: string | SelectedTab,
    screen?: string,
    insideRouting?: string,
  ) => {
    setSelectedTab(tab as any);
    if (screen && !insideRouting) {
      navigation.navigate(screen as any);
      setSelectedTab(undefined);
    } else if (screen && insideRouting) {
      navigation.navigate(insideRouting as any, { screen });
      setSelectedTab(undefined);
    }
  };

  const handleGoBack = () => {
    setSelectedTab(undefined);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.selectedContent}>
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
          <IconButton
            icon="AnchorBack"
            size={25}
            onPress={handleGoBack}
            style={styles.backButton}
          />
          <PixelPeace></PixelPeace>
        </ScrollView>
      </KeyboardAvoidingView>
   
    </View>
  );
};
