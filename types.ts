export interface ColorOption {
  name: string;
  hex: string;
  description?: string;
  isAI?: boolean;
  manufacturer?: string;
  code?: string;
}

export interface HardwareOption {
  name: string;
  id: string;
  description: string;
}

export interface AnalysisResult {
  suggestedColors: ColorOption[];
  reasoning: string;
}

export type ProcessingState = 'idle' | 'analyzing' | 'generating' | 'complete' | 'error';