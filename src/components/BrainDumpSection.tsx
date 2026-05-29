import type { PersonaType, PersonaReview } from '../types';

interface BrainDumpSectionProps {
  brainDump: string;
  setBrainDump: (val: string) => void;
  detectedLang: string;
  setIsDetectingLang: (val: boolean) => void;
  setDetectedLang: (val: string) => void;
  isDetectingLang: boolean;
  isStructuring: boolean;
  activePersona: PersonaType;
  setActivePersona: (persona: PersonaType) => void;
  reviews: Record<PersonaType, PersonaReview>;
  isReviewing: boolean;
  backgroundAIProgress: string;
  backgroundAIPercent: number;
  onStructurePitch: () => void;
}

export default function BrainDumpSection({
  brainDump,
  setBrainDump,
  detectedLang,
  setIsDetectingLang,
  setDetectedLang,
  isDetectingLang,
  isStructuring,
  activePersona,
  setActivePersona,
  reviews,
  isReviewing,
  backgroundAIProgress,
  backgroundAIPercent,
  onStructurePitch,
}: BrainDumpSectionProps) {
  const isLanguageSupported = detectedLang === 'Japanese' || detectedLang === 'English';

  return (
    <section className="w-full lg:w-[30%] border-r border-outline-variant/30 p-6 flex flex-col gap-6 bg-surface-container-low/30 overflow-hidden h-full shrink-0">
      <div className="flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span> Brain Dump
          </h2>
          <p className="text-xs text-on-surface-variant opacity-70">Scribble down your raw ideas and core thoughts</p>
        </div>
        
        {/* 言語自動検知インジケーター */}
        <div className="bg-surface-container-highest/80 px-3 py-1 rounded-full border border-outline-variant/30 backdrop-blur-md flex items-center gap-2 text-xs font-mono shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${isDetectingLang ? 'bg-primary animate-ping' : 'bg-secondary'}`} />
          <span className="text-on-surface-variant">
            {isDetectingLang ? 'Detecting...' : `Language: ${detectedLang}`}
          </span>
        </div>
      </div>

      <div className="relative flex-[1.8] flex flex-col min-h-[140px] lg:min-h-[240px] glass-card rounded-xl overflow-hidden ai-focus-card min-h-0">
        <textarea
          value={brainDump}
          onChange={(e) => {
            const val = e.target.value;
            setBrainDump(val);
            if (!val.trim()) {
              setDetectedLang('--');
              setIsDetectingLang(false);
            } else {
              setIsDetectingLang(true);
            }
          }}
          className="flex-grow w-full bg-transparent p-4 text-sm focus:ring-0 border-none outline-none resize-none custom-scrollbar placeholder:text-on-surface-variant/30 text-on-surface"
          placeholder="Write anything you want here. Fast, unstructured ideas about your startup, problem statement, solution, target audience, pricing models..."
        />
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={onStructurePitch}
          disabled={
            isStructuring || 
            !brainDump.trim() || 
            isDetectingLang || 
            !isLanguageSupported
          }
          className="w-full bg-primary-container text-on-primary-container py-3.5 rounded-xl font-bold inner-glow active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
        >
          {isStructuring ? (
            <>
              <span className="animate-spin material-symbols-outlined text-sm">sync</span>
              Analyzing Ideas...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              AI Analyze & Structure
            </>
          )}
        </button>
        {brainDump.trim() && !isDetectingLang && !isLanguageSupported && (
          <p className="text-center text-xs text-rose-500 font-semibold animate-pulse">
            ⚠️ Only Japanese and English inputs are supported.
          </p>
        )}
        <p className="text-center text-[10px] text-on-surface-variant/60 font-mono">
          Automatically segments your ideas on-device
        </p>
      </div>

      {/* Virtual Persona Review */}
      <div className="flex-grow flex flex-col gap-4 min-h-[150px] min-h-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-outline-variant/20 pt-4 shrink-0">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-on-surface text-sm">forum</span> Virtual Persona Review
          </h3>
          <div className="flex bg-surface-container-high rounded-full p-0.5 border border-outline-variant/30">
            {(['investor', 'executive', 'general'] as PersonaType[]).map((p) => (
              <button
                key={p}
                onClick={() => setActivePersona(p)}
                className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-all ${activePersona === p ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow glass-card rounded-xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar min-h-0">
          {isReviewing ? (
            <div className="flex flex-col justify-center items-center h-full gap-4 py-8">
              <div className="flex items-center gap-3 text-sm font-mono text-primary animate-pulse">
                <span className="animate-spin material-symbols-outlined">sync</span>
                {backgroundAIProgress}
              </div>
              <div className="w-full max-w-xs bg-surface-container-high h-2 rounded-full overflow-hidden border border-outline-variant/20">
                <div
                  className="bg-gradient-to-r from-secondary to-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${backgroundAIPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Persona Review Content */}
              <div className="flex gap-3 items-start flex-1 min-h-0">
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0 border border-secondary/20">
                  <span className="material-symbols-outlined text-[18px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                    account_circle
                  </span>
                </div>
                <div className="flex-grow bg-surface-variant/40 rounded-2xl p-3.5 rounded-tl-none border border-outline-variant/20 h-full overflow-y-auto custom-scrollbar">
                  <p className="text-sm leading-relaxed text-on-surface italic">
                    {reviews[activePersona].review}
                  </p>
                </div>
              </div>

              {/* AI Suggestion Content */}
              {reviews[activePersona].suggestion && (
                <div className="flex gap-3 items-start flex-1 min-h-0">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 border border-primary/20">
                    <span className="material-symbols-outlined text-[18px] text-on-primary-container">
                      auto_awesome
                    </span>
                  </div>
                  <div className="flex-grow bg-primary/5 rounded-2xl p-3.5 rounded-tl-none border border-primary/20 h-full overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-primary uppercase font-bold tracking-wider shrink-0">
                      <span className="bg-primary/20 px-1.5 py-0.5 rounded">AI Local Suggestion</span>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface flex-grow overflow-y-auto custom-scrollbar">
                      {reviews[activePersona].suggestion}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
