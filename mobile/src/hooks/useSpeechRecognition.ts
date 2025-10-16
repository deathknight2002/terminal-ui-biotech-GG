import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Hook for speech recognition using Web Speech API
 * Falls back to Capacitor plugin on native iOS
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    continuous = false,
    interimResults = true,
    lang = 'en-US',
    onResult,
    onError,
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
  });

  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    setState((prev) => ({ ...prev, isSupported }));

    if (isSupported && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = lang;

      recognitionRef.current.onstart = () => {
        console.log('[Speech] Recognition started');
        setState((prev) => ({ ...prev, isListening: true, error: null }));
      };

      recognitionRef.current.onend = () => {
        console.log('[Speech] Recognition ended');
        setState((prev) => ({ ...prev, isListening: false }));
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setState((prev) => ({
          ...prev,
          transcript: finalTranscript.trim() || prev.transcript,
          interimTranscript: interimTranscript.trim(),
        }));

        if (finalTranscript.trim()) {
          onResult?.(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('[Speech] Recognition error:', event.error);
        const errorMessage = `Speech recognition error: ${event.error}`;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isListening: false,
        }));
        onError?.(errorMessage);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, interimResults, lang, onResult, onError]);

  const start = useCallback(() => {
    if (!state.isSupported) {
      const error = 'Speech recognition is not supported in this browser';
      console.error('[Speech]', error);
      setState((prev) => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    if (!state.isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setState((prev) => ({ ...prev, transcript: '', interimTranscript: '', error: null }));
      } catch (error) {
        console.error('[Speech] Failed to start recognition:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to start recognition';
        setState((prev) => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
      }
    }
  }, [state.isSupported, state.isListening, onError]);

  const stop = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: null,
    }));
  }, []);

  return {
    ...state,
    start,
    stop,
    reset,
  };
}
