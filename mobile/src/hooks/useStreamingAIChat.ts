import { useState, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { ChatMessage } from '../components/AIChatInterface';

interface UseStreamingAIChatOptions {
  onMessageComplete?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for streaming AI chat responses via WebSocket
 * Integrates with backend streaming API for real-time AI responses
 */
export function useStreamingAIChat(options: UseStreamingAIChatOptions = {}) {
  const { onMessageComplete, onError } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const currentStreamRef = useRef<string>('');
  const currentMessageIdRef = useRef<string>('');

  const { socket, isConnected, emit, on, off } = useWebSocket({
    autoConnect: true,
    onError: (error) => {
      console.error('[AI Chat] WebSocket error:', error);
      onError?.(error);
    },
  });

  // Setup streaming event handlers
  const setupStreamHandlers = useCallback(() => {
    if (!socket) return;

    // Handle streaming chunks
    on('ai_stream_chunk', (data: { messageId: string; chunk: string }) => {
      currentMessageIdRef.current = data.messageId;
      currentStreamRef.current += data.chunk;

      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.id === data.messageId) {
          // Update existing streaming message
          return prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, content: currentStreamRef.current, streaming: true }
              : msg
          );
        } else {
          // Create new streaming message
          return [
            ...prev,
            {
              id: data.messageId,
              role: 'assistant',
              content: currentStreamRef.current,
              timestamp: new Date(),
              streaming: true,
            },
          ];
        }
      });
    });

    // Handle stream complete
    on('ai_stream_complete', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, streaming: false } : msg
        )
      );

      const completedMessage = messages.find((m) => m.id === data.messageId);
      if (completedMessage) {
        onMessageComplete?.(completedMessage);
      }

      currentStreamRef.current = '';
      currentMessageIdRef.current = '';
      setIsStreaming(false);
    });

    // Handle stream error
    on('ai_stream_error', (data: { messageId: string; error: string }) => {
      console.error('[AI Chat] Stream error:', data.error);
      onError?.(new Error(data.error));
      setIsStreaming(false);
      currentStreamRef.current = '';
      currentMessageIdRef.current = '';
    });

    return () => {
      off('ai_stream_chunk');
      off('ai_stream_complete');
      off('ai_stream_error');
    };
  }, [socket, on, off, messages, onMessageComplete, onError]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!isConnected || isStreaming) {
        console.warn('[AI Chat] Cannot send message - not connected or already streaming');
        return;
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      currentStreamRef.current = '';

      // Emit to backend for streaming response
      emit('ai_chat_stream', {
        message: content,
        messageId: `assistant-${Date.now()}`,
        context: messages.slice(-10), // Send last 10 messages for context
      });
    },
    [isConnected, isStreaming, emit, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    currentStreamRef.current = '';
    currentMessageIdRef.current = '';
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isStreaming,
    isConnected,
    setupStreamHandlers,
  };
}
