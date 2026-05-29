import type { TimePitchType } from '../types';

interface OutputSectionProps {
  timePitches: Record<TimePitchType, string>;
  activeTime: TimePitchType;
  isSummarizing: boolean;
  backgroundAIProgress: string;
  backgroundAIPercent: number;
  translationResult: string;
  isTranslating: boolean;
  activeTransLang: 'en' | 'ja';
  onTimeChange: (time: TimePitchType) => void;
  onTranslateAction: (lang: 'en' | 'ja') => void;
  onCopyToClipboard: (text: string) => void;
  onRefreshSummaries: () => void;
  onSaveLocally: () => void;
}

export default function OutputSection({
  timePitches,
  activeTime,
  isSummarizing,
  backgroundAIProgress,
  backgroundAIPercent,
  translationResult,
  isTranslating,
  activeTransLang,
  onTimeChange,
  onTranslateAction,
  onCopyToClipboard,
  onRefreshSummaries,
  onSaveLocally,
}: OutputSectionProps) {
  return (
    <section className="w-full lg:w-[30%] p-6 flex flex-col gap-6 bg-surface-container-low/30 overflow-y-auto custom-scrollbar shrink-0">
      <div className="shrink-0">
        <h2 className="text-xl font-bold text-tertiary flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">send</span> Output
        </h2>
        <p className="text-xs text-on-surface-variant opacity-70">Final refined deliverables</p>
      </div>

      {/* Time-based Pitch Generation */}
      <div className="flex flex-col gap-2 flex-grow basis-0 min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <label className="text-xs font-bold text-on-surface">Time-based Pitch Generation</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopyToClipboard(timePitches[activeTime])}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold text-on-surface-variant hover:text-primary hover:bg-primary/10 border border-outline-variant/20 transition-all active:scale-95 shadow-sm"
              title="Copy to Clipboard"
            >
              <span className="material-symbols-outlined text-xs">content_copy</span> Copy
            </button>
            <button 
              onClick={onRefreshSummaries}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold text-on-surface-variant hover:text-tertiary hover:bg-tertiary/10 border border-outline-variant/20 transition-all"
            >
              <span className="material-symbols-outlined text-xs">refresh</span> Re-Gen
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
          <div className="flex bg-surface-container-high rounded-lg p-0.5 border border-outline-variant/30 w-fit">
            {(['15', '30', '60'] as TimePitchType[]).map((time) => (
              <button
                key={time}
                onClick={() => onTimeChange(time)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${activeTime === time ? 'bg-surface-bright text-primary border border-primary/20 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {time}s
              </button>
            ))}
          </div>
          <p className="text-[9px] font-mono text-on-surface-variant/60 italic uppercase tracking-tighter">
            Triggers local summarizer
          </p>
        </div>

        <div className="relative flex-grow min-h-[120px] glass-card rounded-xl overflow-hidden group flex flex-col mt-2">
          {isSummarizing ? (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center text-xs font-mono text-tertiary gap-3 z-10">
              <div className="flex items-center gap-2 animate-pulse">
                <span className="animate-spin material-symbols-outlined">sync</span>
                {backgroundAIProgress}
              </div>
              <div className="w-40 bg-surface-container-high h-1.5 rounded-full overflow-hidden border border-outline-variant/10">
                <div
                  className="bg-tertiary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${backgroundAIPercent}%` }}
                />
              </div>
            </div>
          ) : null}
          <textarea
            readOnly
            value={timePitches[activeTime]}
            className="w-full h-full bg-transparent p-4 text-sm font-body border-none focus:ring-0 resize-none custom-scrollbar leading-relaxed text-on-surface"
          />
        </div>
      </div>

      {/* Translation Section */}
      <div className="flex flex-col gap-2 flex-grow basis-0 min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <label className="text-xs font-bold text-on-surface">Multi-language Translation</label>
          <button 
            onClick={() => onTranslateAction(activeTransLang)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase font-bold text-on-surface-variant hover:text-tertiary transition-colors"
          >
            <span className="material-symbols-outlined text-xs">refresh</span> Re-Translate
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
          <div className="flex gap-2">
            {(['en', 'ja'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => onTranslateAction(lang)}
                className={`px-3 py-1 rounded-full border text-xs font-mono uppercase transition-all ${activeTransLang === lang ? 'border-tertiary text-tertiary bg-tertiary/10 font-bold shadow-sm' : 'border-outline-variant text-on-surface-variant hover:text-on-surface'}`}
              >
                {lang === 'en' ? 'English' : '日本語'}
              </button>
            ))}
          </div>
          <p className="text-[9px] font-mono text-on-surface-variant/60 italic uppercase tracking-tighter">
            Local Translator API
          </p>
        </div>

        <div className="flex-grow min-h-[120px] glass-card rounded-xl p-4 border-dashed border-outline-variant/50 relative mt-2 flex flex-col">
          {isTranslating ? (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-secondary gap-2 z-10 animate-pulse">
              <span className="animate-spin material-symbols-outlined">sync</span>
              Translating...
            </div>
          ) : null}
          <div className="text-sm text-on-surface-variant italic leading-relaxed overflow-y-auto flex-grow custom-scrollbar">
            {translationResult}
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-surface-container-high/80 px-2 py-1 rounded border border-outline-variant/20 backdrop-blur-sm z-20">
            <span className="material-symbols-outlined text-secondary text-xs">enhanced_encryption</span>
            <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-tighter">
              On-Device Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Export / Save Action */}
      <div className="mt-auto pt-4 border-t border-outline-variant/20 shrink-0">
        <button
          onClick={onSaveLocally}
          className="w-full border border-secondary/40 text-secondary hover:bg-secondary/10 font-mono text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-sm">lock_open</span>
          Save Locally Encrypted (JSON)
        </button>
      </div>
    </section>
  );
}
