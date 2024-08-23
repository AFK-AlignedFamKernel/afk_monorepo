export type User = {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
};

export type Message = {
  user: User;
  message: string;
  createdAt: Date;
}

export type Conversation = {
  id: string;
  user: User;
  messages: Message[];
};
