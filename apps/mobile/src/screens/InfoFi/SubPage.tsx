import {Text, View} from 'react-native';
import {useStyles, useTheme} from '../../hooks';
import {SubPageScreenProps} from '../../types';
import stylesheet from '../../modules/InfoFi/styles';
import { SubPageComponent } from '../../modules/InfoFi/SubPageComponent';
export const SubPageScreen: React.FC<SubPageScreenProps> = ({route}) => {
  const { subAddress,  } = route.params;
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  if(!subAddress) {
    return (
      <View style={styles.container}>
          <Text>No sub address</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
        <SubPageComponent subAddress={subAddress as string}></SubPageComponent>
    </View>
  );
};
