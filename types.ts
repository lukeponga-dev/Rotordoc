export interface Message {
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
}

export interface Session {
  id: string;
  name: string;
  messages: Message[];
}
