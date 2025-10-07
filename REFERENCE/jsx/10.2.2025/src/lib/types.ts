export type FeatureFlag = 'GROK_CODE_FAST_PREVIEW' | 'GPT5_ENABLED';

export interface FeatureFlagsState {
  GROK_CODE_FAST_PREVIEW: boolean;
  GPT5_ENABLED: boolean;
}

export interface ModelSpec {
  id: string;
  name: string;
  provider: string;
  capabilities: string[]; // e.g. ['code','chat','reasoning']
  preview?: boolean;
  flagsRequired?: FeatureFlag[];
}
