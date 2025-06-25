/* eslint-disable no-case-declarations */
import React, {useState} from 'react';
import {View} from 'react-native';

import {useStyles, useTheme} from '../../hooks';
import {DayPicker} from './DayPicker';
import {MonthPicker} from './MonthPicker';
import styleSheet from './styles';
import {TimePicker} from './TimePicker';
import {DatePickerProps} from './types';

export const DatePicker: React.FC<DatePickerProps> = ({onDateChange, initialDate = new Date()}) => {
  const styles = useStyles(styleSheet);
  const {theme} = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  const handleDateChange = (type: 'month' | 'day' | 'hour' | 'minute' | 'ampm', value: number) => {
    const newDate = new Date(selectedDate);

    switch (type) {
      case 'month':
        newDate.setMonth(value);
        break;
      case 'day':
        newDate.setDate(value);
        break;
      case 'hour':
        const currentHours = newDate.getHours();
        const isPM = currentHours >= 12;
        newDate.setHours(isPM ? value + 12 : value);
        break;
      case 'minute':
        newDate.setMinutes(value);
        break;
      case 'ampm':
        const hours = newDate.getHours();
        const currentHour = hours % 12 || 12;
        newDate.setHours(value === 1 ? currentHour + 12 : currentHour);
        break;
    }

    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  return (
    <View style={styles.main_container}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 4,
        }}
      >
        <MonthPicker
          selectedMonth={selectedDate.getMonth()}
          onMonthChange={(value: any) => handleDateChange('month', value)}
          theme={theme}
        />

        <DayPicker
          selectedDate={selectedDate}
          onDayChange={(value) => handleDateChange('day', value)}
          theme={theme}
        />
      </View>

      <View style={styles.main_row}>
        <TimePicker selectedDate={selectedDate} onTimeChange={handleDateChange} theme={theme} />
      </View>
    </View>
  );
};
