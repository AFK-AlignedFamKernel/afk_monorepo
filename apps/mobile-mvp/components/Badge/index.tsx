import React from 'react';
import {Text, View, ViewStyle} from 'react-native';

import {useStyles} from '../../hooks';
import styleSheet from './styles';

type BadgeProps = {
  value: string;
  status?: 'default';
  style?: ViewStyle;
};

const Badge: React.FC<BadgeProps> = ({value, status = 'default', style}) => {
  const styles = useStyles(styleSheet);
  return (
    <View style={[styles.badge, styles[status], style]}>
      <Text style={styles.badgeText}>{value}</Text>
    </View>
  );
};

export default Badge;
