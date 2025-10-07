export interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string; }
export interface ChatRequestBody { model: string; messages: ChatMessage[]; }