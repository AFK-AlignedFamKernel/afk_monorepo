export type NotificationData = {
  type: 'tip' | 'privateMessage' | 'tokenLaunch' | 'note' | 'tokenLiquidity';
  data: {
    amount?: string;
    token?: string;
    senderName?: string;
    tokenName?: string;
    action?: string;
    authorName?: string;
    conversationId?: string;
    coinAddress?: string;
    noteId?: string;
    liquidityAmount?: string;
  };
};
