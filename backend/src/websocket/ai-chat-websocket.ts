import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger.js';

/**
 * Setup AI chat streaming WebSocket handlers
 */
export function setupAIChatWebSocket(io: SocketServer): void {
  logger.info('🤖 Setting up AI chat streaming WebSocket');

  io.on('connection', (socket) => {
    // Handle AI chat stream request
    socket.on('ai_chat_stream', async (data: {
      message: string;
      messageId: string;
      context?: any[];
    }) => {
      const { message, messageId, context } = data;

      logger.info(`[AI Chat] Stream request: ${message.substring(0, 50)}...`);

      try {
        // Simulate streaming response (in production, this would call an AI API)
        const response = await generateStreamingResponse(message);

        // Stream response in chunks
        const chunkSize = 5; // words per chunk
        const words = response.split(' ');

        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';

          // Emit chunk
          socket.emit('ai_stream_chunk', {
            messageId,
            chunk,
          });

          // Simulate processing delay
          await delay(100);
        }

        // Emit completion
        socket.emit('ai_stream_complete', {
          messageId,
        });

        logger.info(`[AI Chat] Stream completed: ${messageId}`);
      } catch (error) {
        logger.error(`[AI Chat] Stream error:`, error);
        socket.emit('ai_stream_error', {
          messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Handle AI chat history request
    socket.on('ai_chat_history', async (data: { limit?: number }) => {
      try {
        // In production, fetch from database
        const history = [];

        socket.emit('ai_chat_history_response', {
          history,
        });
      } catch (error) {
        logger.error('[AI Chat] History error:', error);
        socket.emit('ai_chat_history_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  });
}

/**
 * Generate AI response (mock implementation)
 * In production, this would call OpenAI, Anthropic, or another AI service
 */
async function generateStreamingResponse(message: string): Promise<string> {
  const lowercaseMessage = message.toLowerCase();

  if (lowercaseMessage.includes('market cap') || lowercaseMessage.includes('top companies')) {
    return `Based on current market data, here are the top biotech companies by market cap: Vertex Pharmaceuticals (VRTX) at $89.2B leading in cystic fibrosis treatments with a strong pipeline in genetic diseases. Regeneron (REGN) at $78.5B with success from Eylea and Dupixent plus a robust oncology pipeline. Moderna (MRNA) at $52.1B as the mRNA platform leader expanding beyond COVID vaccines. Would you like detailed analysis on any of these companies?`;
  }

  if (lowercaseMessage.includes('phase iii') || lowercaseMessage.includes('clinical trial')) {
    return `Current Phase III trials in oncology include: BioTech Inc BTX-301 for non-small cell lung cancer targeting PD-L1 inhibitor with expected readout in Q2 2026 and patient enrollment at 1247 out of 1500. PharmaCo PC-402 for triple-negative breast cancer using an antibody-drug conjugate with expected readout in Q4 2025 and complete patient enrollment. These trials show promising interim data. Would you like detailed efficacy metrics?`;
  }

  if (lowercaseMessage.includes('fda') || lowercaseMessage.includes('catalyst')) {
    return `Upcoming FDA catalysts this quarter include high priority items like Amgen AMGN Lumakras PDUFA date on December 15 2025 for small cell lung cancer indication with a positive advisory committee vote of 12 to 2. Gilead GILD Trodelvy expansion on January 8 2026 for HR positive breast cancer with compelling Phase III data. Medium priority items include BioNTech mRNA vaccine on January 22 2026 and Novartis heart failure drug on February 5 2026. These dates are subject to FDA review timeline changes.`;
  }

  // Default response
  return `I understand you're asking about "${message}". As your AI biotech assistant, I can help you with company profiles and financial analysis, drug pipeline tracking, clinical trial data and outcomes, FDA approval timelines and catalysts, and market intelligence and competitor analysis. Could you please provide more specific details about what you'd like to know?`;
}

/**
 * Utility function to add delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
