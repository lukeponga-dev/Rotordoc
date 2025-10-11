export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  isError?: boolean;
}

export interface Session {
  id: string;
  name: string;
  messages: Message[];
}