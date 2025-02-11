import {Image, KeyboardAvoidingView, ScrollView, View} from 'react-native';

import {Text} from '../../components';
import {useStyles, useWindowDimensions} from '../../hooks';
import stylesheet from './styles';
import { useMemo } from 'react';

export type AuthProps = {
  title: string;
  children?: React.ReactNode;
};

export const Auth: React.FC<AuthProps> = ({title, children}) => {
  const styles = useStyles(stylesheet);

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1, height: '100%'}}>
      <View style={styles.container}>
        <View style={styles.background}>
          <Image
            style={styles.backgroundImage}
            source={require('../../assets/login-background.png')}
          />

          <View style={styles.middle}>
            <View style={styles.logo}>
              <Image
                style={styles.logoImage}
                // source={require('../../assets/pepe-logo.png')}
                source={require('../../assets/afk_logo_circle.png')}
              />
              {/* <Image style={styles.logoImage} source={require('../../assets/afkMascot.png')} /> */}
            </View>

            <Text weight="bold" fontSize={35} style={[styles.title, !isDesktop && styles.titleMobile]}>
              {title}
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <ScrollView>
            <View style={styles.content}>{children}</View>
          </ScrollView>
        </View>
      </View>
     </KeyboardAvoidingView>
  );
};
