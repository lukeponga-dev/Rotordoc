
export interface Message {
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
}
