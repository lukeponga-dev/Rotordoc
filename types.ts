export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  isError?: boolean;
}

export interface Session {
  id: string;
  name: string;
  messages: Message[];
}

export interface DiagnosticState {
  potentialCauses: string[];
  ruledOut: string[];
  keyFacts: string[];
}
