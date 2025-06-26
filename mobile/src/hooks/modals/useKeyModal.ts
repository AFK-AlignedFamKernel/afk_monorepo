import {useContext} from 'react';

import {KeyModalContext} from '../../context/KeysModal';

export const useKeyModal = () => {
  const context = useContext(KeyModalContext);

  if (!context) {
    throw new Error('useKeyModal must be used within a KeyModalContext');
  }

  return context;
};
