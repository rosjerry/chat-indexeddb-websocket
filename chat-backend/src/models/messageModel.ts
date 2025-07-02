export interface Message {
  id: number | string;
  text: string;
  sender: string;
  timestamp: Date;
}

export let messages: Message[] = [];