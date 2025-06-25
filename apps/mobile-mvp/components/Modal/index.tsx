import {View, ViewProps, useWindowDimensions} from 'react-native';
import {Portal} from 'react-native-portalize';
import {useStyles} from '../../hooks';
import stylesheet from './styles';

export type ModalProps = ViewProps & {
  containerProps?: ViewProps;
};

export const Modal: React.FC<ModalProps> = ({
  containerProps,
  style: styleProp,
  children,
  ...modalProps
}) => {
  const styles = useStyles(stylesheet);
  const {width} = useWindowDimensions();
  const isDesktop = width >= 1024;

  return (
    <Portal>
      <View style={[styles.container, containerProps?.style]} {...containerProps}>
        <View
          style={[styles.modal, styleProp, isDesktop ? styles.desktopModal : styles.mobileModal]}
          {...modalProps}
        >
          {children}
        </View>
      </View>
    </Portal>
  );
};