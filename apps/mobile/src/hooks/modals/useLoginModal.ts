import {useContext, useMemo} from 'react';

import {LoginModalContext} from '../../context/LoginModalProvider';

export const useLoginModal = () => {
  const context = useContext(LoginModalContext);

  if (!context) {
    throw new Error('useDialog must be used within a LoginModalContext');
  }

  return useMemo(() => ({show: context.show, hideDialog: context.hide}), [context]);
};
