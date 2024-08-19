import {useContext} from 'react';

import {TokenModalContext} from '../../context/TokenCreateModal';

export const useTokenCreatedModal = () => {
  const context = useContext(TokenModalContext);

  if (!context) {
    throw new Error('useTokenCreatedModal error with TokenModalContext');
  }

  return context;
};
