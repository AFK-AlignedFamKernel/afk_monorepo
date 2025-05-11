import {SVGProps as SvgProps} from 'react';

import * as Icons from './icons';

export type IconNames = keyof typeof Icons;

export type IconProps = SvgProps<SVGElement> & {
  name: IconNames;
  size?: number;
  // color?: ColorProp;
};

export const Icon: React.FC<IconProps> = ({name, size, ...props}) => {
  // const color = useColor(colorProp);

  const IconComponent = Icons[name];

  return <IconComponent width={size} height={size} className="icon" {...props} />;
};
