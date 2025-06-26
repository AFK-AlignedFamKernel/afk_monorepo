export type User = {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
};

export type Message = {
  message: string;
  isUser: boolean; // Indicates if the message is from the current user or the other party
  timestamp: string;
};

export type ConversationType = {
  id: string;
  user: User;
  messages: Message[];
};
