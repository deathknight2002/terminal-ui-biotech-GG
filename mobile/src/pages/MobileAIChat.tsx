import { FC, useState } from 'react';
import { AIChatInterface, ChatMessage } from '../components/AIChatInterface';
import './MobileAIChat.css';

// Mock AI response function - in production, this would call the backend
const mockAIResponse = async (userMessage: string): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const lowercaseMessage = userMessage.toLowerCase();

  if (lowercaseMessage.includes('market cap') || lowercaseMessage.includes('top companies')) {
    return `Based on current market data, here are the top biotech companies by market cap:

1. **Vertex Pharmaceuticals (VRTX)** - $89.2B
   - Leading in cystic fibrosis treatments
   - Strong pipeline in genetic diseases

2. **Regeneron (REGN)** - $78.5B
   - Success with Eylea and Dupixent
   - Robust oncology pipeline

3. **Moderna (MRNA)** - $52.1B
   - mRNA platform leader
   - Expanding beyond COVID vaccines

Would you like detailed analysis on any of these companies?`;
  }

  if (lowercaseMessage.includes('phase iii') || lowercaseMessage.includes('clinical trial')) {
    return `Current Phase III trials in oncology (active):

**BioTech Inc - BTX-301**
- Indication: Non-small cell lung cancer
- Target: PD-L1 inhibitor
- Expected readout: Q2 2026
- Patient enrollment: 1,247/1,500

**PharmaCo - PC-402**
- Indication: Triple-negative breast cancer
- Target: ADC (antibody-drug conjugate)
- Expected readout: Q4 2025
- Patient enrollment: Complete

These trials show promising interim data. Would you like detailed efficacy metrics?`;
  }

  if (lowercaseMessage.includes('fda') || lowercaseMessage.includes('catalyst')) {
    return `Upcoming FDA catalysts this quarter:

**High Priority:**
- **Amgen (AMGN)** - Lumakras PDUFA date: Dec 15, 2025
  - Small cell lung cancer indication
  - Advisory committee vote: Positive 12-2

- **Gilead (GILD)** - Trodelvy expansion: Jan 8, 2026
  - HR+ breast cancer
  - Compelling Phase III data

**Medium Priority:**
- BioNTech mRNA vaccine: Jan 22, 2026
- Novartis heart failure drug: Feb 5, 2026

These dates are subject to FDA review timeline changes.`;
  }

  // Default response
  return `I understand you're asking about "${userMessage}". 

As your AI biotech assistant, I can help you with:
- Company profiles and financial analysis
- Drug pipeline tracking
- Clinical trial data and outcomes
- FDA approval timelines and catalysts
- Market intelligence and competitor analysis

Could you please provide more specific details about what you'd like to know?`;
};

export const MobileAIChat: FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get AI response
      const aiContent = await mockAIResponse(content);

      // Add AI message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-ai-chat-page">
      <AIChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        enableVoiceInput={true}
      />
    </div>
  );
};
