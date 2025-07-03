export interface Message {
  id: string;
  text: string;
  user: string;
  timestamp: string;
}

export let messages: Message[] = [];