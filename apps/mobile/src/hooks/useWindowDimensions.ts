import {Dimensions, Platform, useWindowDimensions as useRNWindowDimensions} from 'react-native';

import {WEB_MAX_WIDTH} from '../constants/misc';
import { useMemo, useState } from 'react';

export const useWindowDimensions = () => {
  const dimensions = useRNWindowDimensions();

  // if (Platform.OS === 'web') dimensions.width = Math.min(dimensions.width, WEB_MAX_WIDTH);
  // if (Platform.OS === 'web') dimensions.width = Math.min(dimensions.width, WEB_MAX_WIDTH);
  if (Platform.OS === 'web') dimensions.width = Math.min(dimensions.width);

  return dimensions;
};

export const useDimensions = () => {
  // const [dimension, setDimension] = useState()
  const width = useMemo(() => {
      return Dimensions.get("window").width

  },[Dimensions.get("window").width])

  const isDesktop = useMemo(() => {
      return width>= 1024 ? true :false
  },[width])

  return  {
      width,
      isDesktop
  }
}