import {Theme} from '../../styles';

export interface DatePickerProps {
  onDateChange: (date: Date) => void;
  initialDate?: Date;
  isDarkMode?: boolean;
}

export interface PickerItemProps {
  label: string;
  value: number;
}

export interface TimePickerProps {
  selectedDate: Date;
  onTimeChange: (type: 'hour' | 'minute' | 'ampm', value: number) => void;
  theme: Theme;
}

export interface MonthPickerProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  theme: Theme;
}

export interface DayPickerProps {
  selectedDate: Date;
  onDayChange: (day: number) => void;
  theme: Theme;
}
