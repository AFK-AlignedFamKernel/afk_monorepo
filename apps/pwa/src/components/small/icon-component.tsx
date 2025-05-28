import { forwardRef, ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

import * as Icons from './icons';

export type IconNames = keyof typeof Icons;

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconNames;
  size?: number;
  // color?: ColorProp;
};

export const Icon = forwardRef<SVGSVGElement, IconProps>(({ name, size, ...props }, ref) => {
  // const color = useColor(colorProp);

  const IconComponent = Icons[name] as ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

  return <IconComponent ref={ref} width={size} height={size} className="icon" {...props} />;
});
