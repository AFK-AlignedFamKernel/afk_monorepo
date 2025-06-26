import {Picker} from '@react-native-picker/picker';
import React from 'react';
import {Text, View} from 'react-native';

import {useStyles} from '../../hooks';
import styleSheet from './styles';
import {TimePickerProps} from './types';

export const TimePicker: React.FC<TimePickerProps> = ({selectedDate, onTimeChange, theme}) => {
  const styles = useStyles(styleSheet);
  return (
    <View style={styles.timeContainer}>
      <Picker
        selectedValue={selectedDate.getHours() % 12 || (12 as any)}
        style={[
          styles.picker,
          {
            backgroundColor: theme.colors.streamStudio_inputBackground,
            color: theme.colors.inputText,
          },
        ]}
        onValueChange={(value: number) => onTimeChange('hour', value)}
      >
        {Array.from({length: 12}, (_, i) => i + 1).map((hour) => (
          <Picker.Item
            key={hour}
            label={hour.toString().padStart(2, '0')}
            value={hour}
            color={theme.colors.inputText}
          />
        ))}
      </Picker>

      <Text style={[styles.timeColon, {color: theme.colors.inputText}]}>:</Text>

      <Picker
        selectedValue={selectedDate.getMinutes() as any}
        style={[
          styles.picker,
          {
            backgroundColor: theme.colors.streamStudio_inputBackground,
            color: theme.colors.inputText,
          },
        ]}
        onValueChange={(value: number) => onTimeChange('minute', value)}
      >
        {Array.from({length: 60}, (_, i) => i).map((minute) => (
          <Picker.Item
            key={minute}
            label={minute.toString().padStart(2, '0')}
            value={minute}
            color={theme.colors.inputText}
          />
        ))}
      </Picker>

      <Picker
        selectedValue={selectedDate.getHours() >= 12 ? 1 : (0 as any)}
        style={[
          styles.picker,
          {
            backgroundColor: theme.colors.streamStudio_inputBackground,
            color: theme.colors.inputText,
          },
        ]}
        onValueChange={(value: number) => onTimeChange('ampm', value)}
      >
        <Picker.Item label="AM" value={0} color={theme.colors.inputText} />
        <Picker.Item label="PM" value={1} color={theme.colors.inputText} />
      </Picker>
    </View>
  );
};
