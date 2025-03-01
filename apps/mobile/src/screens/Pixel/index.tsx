import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { IconButton } from '../../components';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import { PixelPeace } from '../../modules/PixelPeace';
import { PixelScreenProps } from '../../types';
import stylesheet from './styles';

export const PixelScreen: React.FC<PixelScreenProps> = ({ navigation }) => {
  const styles = useStyles(stylesheet);

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.selectedContent}>
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
          <IconButton
            icon="AnchorBack"
            size={25}
            // onPress={handleGoBack}
            style={styles.backButton}
          />
          <PixelPeace></PixelPeace>
        </ScrollView>
      </KeyboardAvoidingView>
   
    </View>
  );
};
