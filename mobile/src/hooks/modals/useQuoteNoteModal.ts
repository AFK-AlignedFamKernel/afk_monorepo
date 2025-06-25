import {useContext, useMemo} from 'react';

import { QuoteNostrModalContext } from 'src/context/QuoteNostrModal';

export const useQuoteNoteModal = () => {
  const context = useContext(QuoteNostrModalContext);

  if (!context) {
    throw new Error('useDialog must be used within a QuoteNostrModalContext');
  }

  return useMemo(() => ({show: context.show, hideDialog: context.hide}), [context]);
};
