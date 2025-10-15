import { FC, useState, useRef, useEffect } from 'react';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import './AIChatInterface.css';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

interface AIChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading?: boolean;
  placeholder?: string;
  enableVoiceInput?: boolean;
}

export const AIChatInterface: FC<AIChatInterfaceProps> = ({
  onSendMessage,
  messages,
  isLoading = false,
  placeholder = 'Ask about biotech data, drug pipelines, or market intelligence...',
  enableVoiceInput = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    await triggerHaptic('light');
    const message = inputValue.trim();
    setInputValue('');
    await onSendMessage(message);
  };

  const handleVoiceInput = async () => {
    await triggerHaptic('medium');
    // Placeholder for voice input - would use Web Speech API or Capacitor plugin
    console.log('Voice input requested');
    // TODO: Implement speech-to-text
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await triggerHaptic('light');
    setInputValue(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="ai-chat-interface">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-title">
            <span className="chat-icon">🤖</span>
            <span>Biotech AI Assistant</span>
          </div>
          <div className="chat-status">
            <span className={`status-dot ${isLoading ? 'pulsing' : ''}`} />
            <span className="status-text">{isLoading ? 'Thinking...' : 'Online'}</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-state-icon">💬</div>
            <h3 className="empty-state-title">Start a Conversation</h3>
            <p className="empty-state-description">
              Ask me anything about biotech companies, drug pipelines, clinical trials, or
              market intelligence.
            </p>
            <div className="suggestion-chips">
              <button
                className="suggestion-chip"
                onClick={() => handleSuggestionClick('What are the top biotech companies by market cap?')}
              >
                Top Companies
              </button>
              <button
                className="suggestion-chip"
                onClick={() => handleSuggestionClick('Show me Phase III trials in oncology')}
              >
                Clinical Trials
              </button>
              <button
                className="suggestion-chip"
                onClick={() => handleSuggestionClick('Upcoming FDA decisions this quarter')}
              >
                FDA Catalysts
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-bubble">
                  <div className="message-content">
                    {message.content}
                    {message.streaming && (
                      <span className="streaming-cursor">▊</span>
                    )}
                  </div>
                  <div className="message-timestamp">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="chat-message assistant-message">
                <div className="message-bubble">
                  <div className="message-loading">
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form className="chat-input-container" onSubmit={handleSubmit}>
        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
          />
          {enableVoiceInput && (
            <button
              type="button"
              className="voice-input-btn"
              onClick={handleVoiceInput}
              disabled={isLoading}
              aria-label="Voice input"
            >
              🎤
            </button>
          )}
          <button
            type="submit"
            className="send-btn"
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 10L18 2L10 18L8 11L2 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};
