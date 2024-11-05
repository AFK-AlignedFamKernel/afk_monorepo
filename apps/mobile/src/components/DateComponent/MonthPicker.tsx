import {Picker} from '@react-native-picker/picker';
import React from 'react';
import {View} from 'react-native';

import {useStyles} from '../../hooks';
import styleSheet from './styles';
import {MonthPickerProps} from './types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MonthPicker: React.FC<MonthPickerProps> = ({selectedMonth, onMonthChange, theme}) => {
  const styles = useStyles(styleSheet);
  return (
    <View>
      <Picker
        selectedValue={selectedMonth as any}
        style={[
          styles.picker,
          {
            backgroundColor: theme.colors.streamStudio_inputBackground,
            color: theme.colors.inputText,
          },
        ]}
        onValueChange={onMonthChange as any}
      >
        {MONTHS.map((month, index) => (
          <Picker.Item key={month} label={month} value={index} color={theme.colors.inputText} />
        ))}
      </Picker>
    </View>
  );
};
