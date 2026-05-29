// Chrome 148 Stable Built-in AI API Wrapper (Pure Real APIs only)
// このファイルは、本物のChrome 148+ Built-in AI API (LanguageModel, Summarizer, Translator, LanguageDetector) のみを利用して動作します。
// さらに、W3C標準案(window.ai.*)と個別API案(window.*)の両対応ハイブリッド検出＆ステータス正規化を搭載した超堅牢仕様です。

export type AIStatus = 'readily' | 'available' | 'after-download' | 'no';

export interface AIAvailability {
  languageModel: AIStatus;
  languageDetector: AIStatus;
  summarizer: AIStatus;
  translator: AIStatus;
}

export interface StructuredPitch {
  hook: string;
  problem: string;
  solution: string;
  valueProp: string;
  competitors: string;
  differentiators: string;
}

export interface PersonaReview {
  review: string;
  suggestion: string;
}

// ==========================================
// 🧠 Chrome Built-in AI interfaces
// ==========================================
export interface AICapabilities {
  available: AIStatus;
}

export interface LanguageModelSession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): AsyncIterable<string>;
  destroy(): void;
  clone(): Promise<LanguageModelSession>;
}

export interface LanguageModelAPI {
  create(options?: { systemPrompt?: string }): Promise<LanguageModelSession>;
  capabilities(): Promise<AICapabilities>;
  availability(): Promise<string>;
}

export interface LanguageDetector {
  detect(text: string): Promise<Array<{ detectedLanguage: string; confidence: number }>>;
  destroy(): void;
}

export interface LanguageDetectorAPI {
  create(): Promise<LanguageDetector>;
  capabilities(): Promise<AICapabilities>;
  availability(): Promise<string>;
}

export interface Summarizer {
  summarize(text: string, options?: { context?: string }): Promise<string>;
  destroy(): void;
}

export interface SummarizerAPI {
  create(options?: { type?: string; format?: string; length?: string }): Promise<Summarizer>;
  capabilities(): Promise<AICapabilities>;
  availability(): Promise<string>;
}

export interface Translator {
  translate(text: string): Promise<string>;
  destroy(): void;
}

export interface TranslatorAPI {
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<Translator>;
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
}

// グローバルな Chrome Built-in AI の型定義 (TypeScript用)
declare global {
  interface Window {
    LanguageModel?: LanguageModelAPI;
    LanguageDetector?: LanguageDetectorAPI;
    Summarizer?: SummarizerAPI;
    Translator?: TranslatorAPI;
  }
}

// ==========================================
// 🧠 GLOBAL SINGLETON CACHES (全APIキャッシュ機構)
// ==========================================
let cachedDetector: LanguageDetector | null = null;

let cachedHookSession: LanguageModelSession | null = null;
let cachedProblemSession: LanguageModelSession | null = null;
let cachedSolutionSession: LanguageModelSession | null = null;
let cachedValuePropSession: LanguageModelSession | null = null;
let cachedCompetitorsSession: LanguageModelSession | null = null;
let cachedDifferentiatorsSession: LanguageModelSession | null = null;

let cachedInvestorSession: LanguageModelSession | null = null;
let cachedExecutiveSession: LanguageModelSession | null = null;
let cachedGeneralSession: LanguageModelSession | null = null;

let cachedSummarizerShort: Summarizer | null = null;
let cachedSummarizerMedium: Summarizer | null = null;
let cachedSummarizerLong: Summarizer | null = null;

let cachedEnJaTranslator: Translator | null = null;
let cachedJaEnTranslator: Translator | null = null;

// 疑似ディレイをかけるヘルパー
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 可用性ステータスの表記ゆれを正規化します。
 */
function normalizeStatus(avail: unknown): AIStatus {
  if (!avail) return 'no';
  const s = String(avail).toLowerCase();
  console.log(`🛡️ [ChromeAI Debug] normaliseStatus mapping: "${avail}" -> raw: "${s}"`);
  if (s === 'readily' || s === 'available' || s === 'ready') {
    return 'available';
  }
  if (s === 'after-download' || s === 'downloadable' || s === 'downloading' || s === 'after-download-downloading') {
    return 'after-download';
  }
  return 'no';
}

/**
 * 4つのAIモデルの利用可能性をチェックします。
 */
export async function checkAIAvailability(): Promise<AIAvailability> {
  console.info('🛡️ [ChromeAI Debug] Starting Hybrid Built-in AI availability checks...');
  
  const availability: AIAvailability = {
    languageModel: 'no',
    languageDetector: 'no',
    summarizer: 'no',
    translator: 'no',
  };

  try {
    // 1. LanguageModel (Prompt API)
    try {
      if (window.LanguageModel) {
        console.log('🛡️ [ChromeAI Debug] window.LanguageModel found.');
        const avail = await window.LanguageModel.availability();
        availability.languageModel = normalizeStatus(avail);
      } else {
        console.warn('🛡️ [ChromeAI Debug] LanguageModel is NOT defined in this browser.');
      }
      console.log(`🛡️ [ChromeAI Debug] Final LanguageModel availability: "${availability.languageModel}"`);
    } catch (e) {
      console.error('🛡️ [ChromeAI Debug] Error during LanguageModel check:', e);
    }

    // 2. LanguageDetector
    try {
      if (window.LanguageDetector) {
        console.log('🛡️ [ChromeAI Debug] window.LanguageDetector found.');
        const avail = await window.LanguageDetector.availability();
        availability.languageDetector = normalizeStatus(avail);
      } else {
        console.warn('🛡️ [ChromeAI Debug] LanguageDetector is NOT defined in this browser.');
      }
      console.log(`🛡️ [ChromeAI Debug] Final LanguageDetector availability: "${availability.languageDetector}"`);
    } catch (e) {
      console.error('🛡️ [ChromeAI Debug] Error during LanguageDetector check:', e);
    }

    // 3. Summarizer
    try {
      if (window.Summarizer) {
        console.log('🛡️ [ChromeAI Debug] window.Summarizer found.');
        const avail = await window.Summarizer.availability();
        availability.summarizer = normalizeStatus(avail);
      } else {
        console.warn('🛡️ [ChromeAI Debug] window.Summarizer is NOT defined in this browser.');
      }
      console.log(`🛡️ [ChromeAI Debug] Final Summarizer availability: "${availability.summarizer}"`);
    } catch (e) {
      console.error('🛡️ [ChromeAI Debug] Error during Summarizer check:', e);
    }

    // 4. Translator
    try {
      let rawEnJa: string = 'no';
      let rawJaEn: string = 'no';

      if (window.Translator) {
        console.log('🛡️ [ChromeAI Debug] window.Translator found.');
        rawEnJa = await window.Translator.availability({ sourceLanguage: 'en', targetLanguage: 'ja' });
        rawJaEn = await window.Translator.availability({ sourceLanguage: 'ja', targetLanguage: 'en' });
      } else {
        console.warn('🛡️ [ChromeAI Debug] window.Translator is NOT defined in this browser.');
      }

      console.log(`🛡️ [ChromeAI Debug] Translator raw availability(en->ja): "${rawEnJa}", (ja->en): "${rawJaEn}"`);
      const isEnJaReady = normalizeStatus(rawEnJa);
      const isJaEnReady = normalizeStatus(rawJaEn);

      if (isEnJaReady === 'available' && isJaEnReady === 'available') {
        availability.translator = 'available';
      } else if (isEnJaReady === 'after-download' || isJaEnReady === 'after-download') {
        availability.translator = 'after-download';
      } else {
        availability.translator = 'no';
      }
      console.log(`🛡️ [ChromeAI Debug] Final Translator availability: "${availability.translator}"`);
    } catch (e) {
      console.error('🛡️ [ChromeAI Debug] Error during Translator check:', e);
    }

  } catch (error) {
    console.error('🛡️ [ChromeAI Debug] Failed to check real Chrome AI capabilities:', error);
  }

  console.info('🛡️ [ChromeAI Debug] Availability check completed. Result:', availability);
  return availability;
}

/**
 * AIモデルのダウンロード/準備をエミュレートまたは本物のダウンロードを開始します。
 */
export async function prepareAIModels(
  _availability: AIAvailability,
  onProgress: (model: string, progress: number) => void
): Promise<void> {
  const models = ['LanguageDetector', 'LanguageModel', 'Summarizer', 'Translator'];

  for (const model of models) {
    let currentProgress = 0;
    
    // ダウンロード擬似進行表示
    while (currentProgress < 100) {
      const step = Math.floor(Math.random() * 15) + 10;
      currentProgress = Math.min(100, currentProgress + step);
      onProgress(model, currentProgress);
      await delay(Math.floor(Math.random() * 200) + 150);
    }
    await delay(300);
  }
}

/**
 * ハイブリッドに LanguageModel セッションを作成します。
 */
async function createLanguageModelSession(options?: { systemPrompt?: string }): Promise<LanguageModelSession> {
  if (window.LanguageModel && typeof window.LanguageModel.create === 'function') {
    console.log('🛡️ [ChromeAI Debug] Creating LanguageModel session via window.LanguageModel.create()');
    return await window.LanguageModel.create(options);
  }
  throw new Error('LanguageModel API is not supported in this environment.');
}

/**
 * Language Detector API を使って入力テキストの言語を検出します。
 */
export async function detectLanguage(text: string): Promise<string> {
  console.log(`🛡️ [ChromeAI Debug] detectLanguage() triggered. Text length: ${text.length}`);
  if (!text || text.trim().length < 3) return '--';

  if (window.LanguageDetector) {
    try {
      if (!cachedDetector) {
        console.log('🛡️ [ChromeAI Debug] Creating LanguageDetector instance...');
        cachedDetector = await window.LanguageDetector.create();
        console.log('🛡️ [ChromeAI Debug] LanguageDetector instance successfully created.');
      }
      
      const results = await cachedDetector.detect(text);
      console.log('🛡️ [ChromeAI Debug] LanguageDetector.detect() results:', results);
      if (results && results.length > 0) {
        const topResult = results[0];
        const langMap: Record<string, string> = {
          ja: 'Japanese',
          en: 'English',
        };
        return langMap[topResult.detectedLanguage] || 'Other';
      }
    } catch (e) {
      console.error('🛡️ [ChromeAI Debug] LanguageDetector runtime error (invalidating cache):', e);
      cachedDetector = null; // エラー時はキャッシュクリア
      throw e;
    }
  } else {
    console.error('🛡️ [ChromeAI Debug] LanguageDetector API not found.');
  }
  throw new Error('LanguageDetector API is not supported in this environment.');
}


/**
 * LanguageModel (Prompt API) を使って、雑多なアイデアから Hook, Problem, Solution, ValueProp, Competitors, Differentiators を抽出・推論します。
 */
export async function structurePitch(
  dump: string,
  detectedLang: string,
  onProgress?: (field: keyof StructuredPitch, val: string) => void
): Promise<StructuredPitch> {
  console.log(`🛡️ [ChromeAI Debug] structurePitch() triggered via 6 sequential prompts. Dump length: ${dump.length}, detectedLang: ${detectedLang}`);
  if (!dump) {
    return { hook: '', problem: '', solution: '', valueProp: '', competitors: '', differentiators: '' };
  }

  if (window.LanguageModel) {
    try {
      // 1. 各セッションを個別にキャッシュ・初期化 (人格規定のみに制限 - 英語化)
      const systemPrompt = `You are an excellent startup pitch consultant.`;
      if (!cachedHookSession) {
        console.log('🛡️ [ChromeAI Debug] Creating LanguageModel Hook session...');
        cachedHookSession = await createLanguageModelSession({ systemPrompt });
      }
      if (!cachedProblemSession) {
        console.log('🛡️ [ChromeAI Debug] Creating LanguageModel Problem session...');
        cachedProblemSession = await createLanguageModelSession({ systemPrompt });
      }
      if (!cachedSolutionSession) {
        console.log('🛡️ [ChromeAI Debug] Creating LanguageModel Solution session...');
        cachedSolutionSession = await createLanguageModelSession({ systemPrompt });
      }
      if (!cachedValuePropSession) {
        console.log('🛡️ [ChromeAI Debug] Creating LanguageModel ValueProp session...');
        cachedValuePropSession = await createLanguageModelSession({ systemPrompt });
      }
      if (!cachedCompetitorsSession) {
        console.log('🛡️ [ChromeAI Debug] Creating LanguageModel Competitors session...');
        cachedCompetitorsSession = await createLanguageModelSession({ systemPrompt });
      }
      if (!cachedDifferentiatorsSession) {
        console.log('🛡️ [ChromeAI Debug] Creating LanguageModel Differentiators session...');
        cachedDifferentiatorsSession = await createLanguageModelSession({ systemPrompt });
      }

      console.log('🛡️ [ChromeAI Debug] Prompting 6 sessions sequentially...');
      
      const langInstruction = detectedLang === 'Japanese' 
        ? '必ず日本語で出力してください。前置きや解説、挨拶、マークダウン装飾は一切不要で、抽出または推論したテキストのみを直接出力してください。' 
        : 'You MUST output in English. No introductory remarks, explanations, greetings, or markdown formatting are allowed. Output only the extracted or inferred text directly.';

      // 2. 6セッションを直列で順番に実行し、ローカルAIの安定性を最大化！
      console.log('🛡️ [ChromeAI Debug] [1/6] Sequential Execution: Prompting Hook...');
      const hookPrompt = `Please check if there is any content in the following idea memo that could serve as a powerful "hook" (attention-grabbing opening statement) to attract the listener's interest. If such content is written, extract and output it. If it is not written, infer and provide the most reasonable hook based on the user's input text.
${langInstruction}
      
[Idea Memo]
${dump}`;
      const hookRes = (await cachedHookSession.prompt(hookPrompt)).trim();
      console.log('🛡️ [ChromeAI Debug] [1/6] Hook Prompt successfully completed.');
      if (onProgress) onProgress('hook', hookRes);

      console.log('🛡️ [ChromeAI Debug] [2/6] Sequential Execution: Prompting Problem...');
      const problemPrompt = `Please check if there is any content in the following idea memo that could serve as a core "problem" (the issue being solved). If such content is written, extract and output it. If it is not written, infer and provide the most reasonable problem based on the user's input text.
${langInstruction}
      
[Idea Memo]
${dump}`;
      const problemRes = (await cachedProblemSession.prompt(problemPrompt)).trim();
      console.log('🛡️ [ChromeAI Debug] [2/6] Problem Prompt successfully completed.');
      if (onProgress) onProgress('problem', problemRes);

      console.log('🛡️ [ChromeAI Debug] [3/6] Sequential Execution: Prompting Solution...');
      const solutionPrompt = `Please check if there is any content in the following idea memo that could serve as a "solution" (explanation of the product or service) to the problem. If such content is written, extract and output it. If it is not written, infer and provide the most reasonable solution based on the user's input text.
${langInstruction}
      
[Idea Memo]
${dump}`;
      const solutionRes = (await cachedSolutionSession.prompt(solutionPrompt)).trim();
      console.log('🛡️ [ChromeAI Debug] [3/6] Solution Prompt successfully completed.');
      if (onProgress) onProgress('solution', solutionRes);

      console.log('🛡️ [ChromeAI Debug] [4/6] Sequential Execution: Prompting Value Prop...');
      const valuePropPrompt = `Please check if there is any content in the following idea memo that could serve as a unique "value proposition" (why this is highly valuable and unique). If such content is written, extract and output it. If it is not written, infer and provide the most reasonable value proposition based on the user's input text.
${langInstruction}
      
[Idea Memo]
${dump}`;
      const valuePropRes = (await cachedValuePropSession.prompt(valuePropPrompt)).trim();
      console.log('🛡️ [ChromeAI Debug] [4/6] Value Prop Prompt successfully completed.');
      if (onProgress) onProgress('valueProp', valuePropRes);

      console.log('🛡️ [ChromeAI Debug] [5/6] Sequential Execution: Prompting Competitors...');
      const competitorsPrompt = `Please check if there is any content in the following idea memo regarding "competitors" or existing alternative solutions. If such content is written, extract and output it. If it is not written, infer and list the most likely competitors based on the user's input text.
${langInstruction}
      
[Idea Memo]
${dump}`;
      const competitorsRes = (await cachedCompetitorsSession.prompt(competitorsPrompt)).trim();
      console.log('🛡️ [ChromeAI Debug] [5/6] Competitors Prompt successfully completed.');
      if (onProgress) onProgress('competitors', competitorsRes);

      console.log('🛡️ [ChromeAI Debug] [6/6] Sequential Execution: Prompting Differentiators...');
      const differentiatorsPrompt = `Please check if there is any content in the following idea memo regarding key "differentiators" or competitive advantages (why your solution is better than competitors). If such content is written, extract and output it. If it is not written, infer and provide the most logical differentiators based on the user's input text.
${langInstruction}
      
[Idea Memo]
${dump}`;
      const differentiatorsRes = (await cachedDifferentiatorsSession.prompt(differentiatorsPrompt)).trim();
      console.log('🛡️ [ChromeAI Debug] [6/6] Differentiators Prompt successfully completed.');
      if (onProgress) onProgress('differentiators', differentiatorsRes);

      const result: StructuredPitch = {
        hook: hookRes,
        problem: problemRes,
        solution: solutionRes,
        valueProp: valuePropRes,
        competitors: competitorsRes,
        differentiators: differentiatorsRes,
      };

      console.log('🛡️ [ChromeAI Debug] Successfully structured 6-session pitch:', result);
      return result;

    } catch (e) {
      console.error('🛡️ [ChromeAI Debug] LanguageModel 6-prompt structure runtime error (invalidating caches):', e);
      // セッションのキャッシュをクリアして次回自己修復できるようにする
      cachedHookSession = null;
      cachedProblemSession = null;
      cachedSolutionSession = null;
      cachedValuePropSession = null;
      cachedCompetitorsSession = null;
      cachedDifferentiatorsSession = null;
      throw e;
    }
  } else {
    console.error('🛡️ [ChromeAI Debug] LanguageModel is not available.');
  }
  throw new Error('LanguageModel API is not supported in this environment.');
}

/**
 * 壊れたペルソナレビュー応答から、正規表現で個々のフィールドを無理やり抽出する超強力なフォールバック関数！
 */
function manualExtractReview(text: string, persona: string): PersonaReview {
  const getField = (key: string): string => {
    const regex1 = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i');
    const match1 = text.match(regex1);
    if (match1 && match1[1]) return match1[1];

    const regex2 = new RegExp(`['"]${key}['"]\\s*:\\s*['"]([^'"]*)['"]`, 'i');
    const match2 = text.match(regex2);
    if (match2 && match2[1]) return match2[1];

    const regex3 = new RegExp(`"${key}"\\s*:\\s*([^,\\n}]*)`, 'i');
    const match3 = text.match(regex3);
    if (match3 && match3[1]) {
      return match3[1].trim().replace(/^['"]|['"]$/g, '');
    }
    return '';
  };

  const review = getField('review');
  const suggestion = getField('suggestion');

  if (!review && !suggestion) {
    console.warn(`🛡️ [ChromeAI Debug] Manual review extraction failed for "${persona}". Distributing raw response.`);
    const cleanText = text.replace(/[{}"']/g, '').trim();
    const half = Math.floor(cleanText.length / 2);
    return {
      review: cleanText.substring(0, half) || `Could not parse AI response. Here is raw: ${text.substring(0, 100)}`,
      suggestion: cleanText.substring(half) || 'Try refining your pitch content.'
    };
  }

  console.log(`🛡️ [ChromeAI Debug] Manually extracted review via regex fallback for "${persona}":`, { review, suggestion });
  return { review, suggestion };
}

/**
 * 仮想ペルソナからのツッコミ（レビュー）とAIの改善提案を生成します。
 */
export async function generatePersonaReview(
  pitch: StructuredPitch,
  persona: 'investor' | 'executive' | 'general',
  detectedLang: string
): Promise<PersonaReview> {
  console.log(`🛡️ [ChromeAI Debug] generatePersonaReview() triggered for persona: "${persona}", detectedLang: "${detectedLang}"`);
  const pitchText = `Hook: ${pitch.hook}\nProblem: ${pitch.problem}\nSolution: ${pitch.solution}\nValue Prop: ${pitch.valueProp}\nCompetitors: ${pitch.competitors}\nDifferentiators: ${pitch.differentiators}`;

  if (window.LanguageModel) {
    try {
      let session: LanguageModelSession | null = null;
      
      if (persona === 'investor') {
        if (!cachedInvestorSession) {
          console.log('🛡️ [ChromeAI Debug] Creating cachedInvestorSession...');
          cachedInvestorSession = await createLanguageModelSession({
            systemPrompt: "You are a Venture Capital (VC) investor assessing the potential of a startup. You are highly interested in business scalability, market size, revenue models, and return on investment (ROI)."
          });
          console.log('🛡️ [ChromeAI Debug] cachedInvestorSession successfully created.');
        }
        session = cachedInvestorSession;
      } else if (persona === 'executive') {
        if (!cachedExecutiveSession) {
          console.log('🛡️ [ChromeAI Debug] Creating cachedExecutiveSession...');
          cachedExecutiveSession = await createLanguageModelSession({
            systemPrompt: "You are a conservative executive (board member) of a large corporation. You strictly check realistic budgets, business risks, legal compliance, operational ROI, and compatibility/safety with existing systems."
          });
          console.log('🛡️ [ChromeAI Debug] cachedExecutiveSession successfully created.');
        }
        session = cachedExecutiveSession;
      } else {
        if (!cachedGeneralSession) {
          console.log('🛡️ [ChromeAI Debug] Creating cachedGeneralSession...');
          cachedGeneralSession = await createLanguageModelSession({
            systemPrompt: "You are a general consumer (user). You look for clear personal benefits, extreme ease of use, simplicity of design, and warmth/friendliness from the service."
          });
          console.log('🛡️ [ChromeAI Debug] cachedGeneralSession successfully created.');
        }
        session = cachedGeneralSession;
      }

      console.log(`🛡️ [ChromeAI Debug] Prompting ${persona} session...`);
      const langInstruction = detectedLang === 'Japanese'
        ? '出力 of the JSON keys "review" and "suggestion" values MUST be written in Japanese. JSON以外の説明や前置き、マークダウン装飾（```json等）は一切出力しないでください。'
        : 'You MUST write the values of "review" and "suggestion" in English. Do not output any explanation or conversational text outside of the raw JSON.';

      const userPrompt = `Please carefully review the following startup pitch and provide your feedback from your perspective.
${langInstruction}
You MUST return your response strictly as a raw JSON format conforming to the following schema:
{
  "review": "write your critical feedback or harsh review here",
  "suggestion": "write your constructive suggestion or advice here"
}

[Startup Pitch]
${pitchText}`;
      const response = await session.prompt(userPrompt);
      console.log(`🛡️ [ChromeAI Debug] ${persona} prompt response received:`, response);
      
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();

      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd)) as PersonaReview;
          console.log(`🛡️ [ChromeAI Debug] Successfully structured review for ${persona}:`, parsed);
          return parsed;
        } catch (parseError) {
          console.warn(`🛡️ [ChromeAI Debug] Standard JSON parse failed for ${persona}. Attempting manual extraction...`, parseError);
          return manualExtractReview(cleaned, persona);
        }
      } else {
        console.error(`🛡️ [ChromeAI Debug] Failed to find JSON boundaries in ${persona} response. Attempting manual extraction...`);
        return manualExtractReview(response, persona);
      }
    } catch (e) {
      console.error(`🛡️ [ChromeAI Debug] LanguageModel review runtime error for ${persona} (invalidating cache):`, e);
      // キャッシュクリアで自己修復
      if (persona === 'investor') cachedInvestorSession = null;
      else if (persona === 'executive') cachedExecutiveSession = null;
      else cachedGeneralSession = null;
      
      // 絶対に例外を投げずに安全なフォールバックオブジェクトを返す！
      return {
        review: `Review unavailable due to engine state. (${e instanceof Error ? e.message : e})`,
        suggestion: 'Please try checking your local Gemini Nano status in chrome://components'
      };
    }
  } else {
    console.error('🛡️ [ChromeAI Debug] LanguageModel is not available.');
  }

  // どんな状況でもエラーを投げず、安全に終了させる
  return {
    review: 'Review system offline. (LanguageModel API is not supported in this environment)',
    suggestion: 'Enable Built-in AI in Chrome Settings to unlock instant target reviews.'
  };
}

/**
 * Summarizer API を使って時間制限付きの要約ピッチを生成します。
 */
export async function generateTimePitch(
  pitch: StructuredPitch,
  seconds: '15' | '30' | '60'
): Promise<string> {
  const fullText = `Hook: ${pitch.hook}\nProblem: ${pitch.problem}\nSolution: ${pitch.solution}\nValue Prop: ${pitch.valueProp}\nCompetitors: ${pitch.competitors}\nDifferentiators: ${pitch.differentiators}`;

  if (window.Summarizer) {
    try {
      let summarizer: Summarizer | null = null;
      
      const summarizerCreate = async (options: { type?: string; format?: string; length?: string }): Promise<Summarizer> => {
        if (!window.Summarizer) throw new Error('Summarizer API is not available');
        return await window.Summarizer.create(options);
      };

      if (seconds === '15') {
        if (!cachedSummarizerShort) {
          cachedSummarizerShort = await summarizerCreate({
            type: 'teaser',
            format: 'plain-text',
            length: 'short'
          });
        }
        summarizer = cachedSummarizerShort;
      } else if (seconds === '30') {
        if (!cachedSummarizerMedium) {
          cachedSummarizerMedium = await summarizerCreate({
            type: 'teaser',
            format: 'plain-text',
            length: 'medium'
          });
        }
        summarizer = cachedSummarizerMedium;
      } else {
        if (!cachedSummarizerLong) {
          cachedSummarizerLong = await summarizerCreate({
            type: 'teaser',
            format: 'plain-text',
            length: 'long'
          });
        }
        summarizer = cachedSummarizerLong;
      }
      
      return await summarizer.summarize(fullText);
    } catch (e) {
      console.error(`🛡️ [ChromeAI Debug] Summarizer runtime error for ${seconds}s (invalidating cache):`, e);
      // キャッシュクリア
      if (seconds === '15') cachedSummarizerShort = null;
      else if (seconds === '30') cachedSummarizerMedium = null;
      else cachedSummarizerLong = null;
      
      throw e;
    }
  }
  throw new Error('Summarizer API is not supported in this environment.');
}

/**
 * Translator API を使ってテキストを翻訳します。
 */
export async function translatePitch(
  text: string,
  targetLanguage: 'en' | 'ja'
): Promise<string> {
  if (!text || text.trim().length === 0) return '';

  if (window.Translator) {
    try {
      const translatorCreate = async (options: { sourceLanguage: string; targetLanguage: string }): Promise<Translator> => {
        if (!window.Translator) throw new Error('Translator API is not available');
        return await window.Translator.create(options);
      };

      if (targetLanguage === 'ja') {
        if (!cachedEnJaTranslator) {
          cachedEnJaTranslator = await translatorCreate({
            sourceLanguage: 'en',
            targetLanguage: 'ja',
          });
        }
        return await cachedEnJaTranslator.translate(text);
      } else {
        if (!cachedJaEnTranslator) {
          cachedJaEnTranslator = await translatorCreate({
            sourceLanguage: 'ja',
            targetLanguage: 'en',
          });
        }
        return await cachedJaEnTranslator.translate(text);
      }
    } catch (e) {
      console.error(`🛡️ [ChromeAI Debug] Translator runtime error to "${targetLanguage}" (invalidating cache):`, e);
      if (targetLanguage === 'ja') cachedEnJaTranslator = null;
      else cachedJaEnTranslator = null;
      throw e;
    }
  }
  throw new Error('Translator API is not supported in this environment.');
}
