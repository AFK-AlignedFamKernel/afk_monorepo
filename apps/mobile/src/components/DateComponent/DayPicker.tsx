import {Picker} from '@react-native-picker/picker';
import React from 'react';
import {View} from 'react-native';

import {useStyles} from '../../hooks';
import styleSheet from './styles';
import {DayPickerProps} from './types';

export const DayPicker: React.FC<DayPickerProps> = ({selectedDate, onDayChange, theme}) => {
  const styles = useStyles(styleSheet);
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedDate.getDate()}
        style={[
          styles.picker,
          {
            backgroundColor: theme.colors.streamStudio_inputBackground,
            color: theme.colors.inputText,
          },
        ]}
        onValueChange={onDayChange}
      >
        {Array.from({length: getDaysInMonth(selectedDate)}, (_, i) => i + 1).map((day) => (
          <Picker.Item
            key={day}
            label={day.toString()}
            value={day}
            color={theme.colors.streamStudio_inputText}
          />
        ))}
      </Picker>
    </View>
  );
};
