import { useMemo } from 'react';
import { Dimensions, Platform, useWindowDimensions as useRNWindowDimensions } from 'react-native';

export const useWindowDimensions = () => {
  const dimensions = useRNWindowDimensions();

  // if (Platform.OS === 'web') dimensions.width = Math.min(dimensions.width, WEB_MAX_WIDTH);
  // if (Platform.OS === 'web') dimensions.width = Math.min(dimensions.width, WEB_MAX_WIDTH);
  if (Platform.OS === 'web') dimensions.width = Math.min(dimensions.width);

  return dimensions;
};

export const useDimensions = () => {
  const window = Dimensions.get('window');

  const width = useMemo(() => {
    return window.width;
  }, [window.width]);

  const isDesktop = useMemo(() => {
    return width >= 1024;
  }, [width]);

  const isMobile = useMemo(() => {
    return width < 768; // Common breakpoint for mobile
  }, [width]);

  return {
    width,
    isDesktop,
    isMobile,
  };
};
