import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

export function NfcIcon(props: SvgProps) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M6 8.32a7.43 7.43 0 0 1 12 0" />
      <Path d="M8.56 10.87a3.8 3.8 0 0 1 6.88 0" />
      <Path d="M12 12.3a.5.5 0 0 0-.5.5.5.5 0 0 0 .5.5.5.5 0 0 0 .5-.5.5.5 0 0 0-.5-.5Z" />
      <Path d="M17.73 15.61A10 10 0 1 1 6.27 15.61" />
    </Svg>
  );
} 