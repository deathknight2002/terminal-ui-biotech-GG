import type { ModelSpec } from './types';

export const MODELS: ModelSpec[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    capabilities: ['chat', 'reasoning']
  },
  {
    id: 'grok-code-fast-1-preview',
    name: 'Grok Code Fast 1 (Preview)',
    provider: 'xai',
    capabilities: ['code', 'chat'],
    preview: true,
    flagsRequired: ['GROK_CODE_FAST_PREVIEW']
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    capabilities: ['chat', 'reasoning', 'code'],
    flagsRequired: ['GPT5_ENABLED']
  }
];

export function listAvailableModels(activeFlags: { [k: string]: boolean }) {
  return MODELS.filter(m => !m.flagsRequired || m.flagsRequired.every(f => activeFlags[f]));
}
