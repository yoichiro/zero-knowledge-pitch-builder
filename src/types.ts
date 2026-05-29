import type { AIAvailability, StructuredPitch, PersonaReview } from './utils/chromeAI';

export type AppPhase = 'checking' | 'setup' | 'dashboard';
export type PersonaType = 'investor' | 'executive' | 'general';
export type TimePitchType = '15' | '30' | '60';

export { AIAvailability, StructuredPitch, PersonaReview };
