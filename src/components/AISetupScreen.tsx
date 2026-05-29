import type { AIAvailability } from '../types';

interface AISetupScreenProps {
  availability: AIAvailability | null;
  setupTriggered: boolean;
  downloadProgress: Record<string, number>;
  currentDownloadingModel: string;
  onStartSetup: () => void;
}

export default function AISetupScreen({
  availability,
  setupTriggered,
  downloadProgress,
  currentDownloadingModel,
  onStartSetup,
}: AISetupScreenProps) {
  const isReady = (status: string | undefined) => status === 'readily' || status === 'available';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-on-surface p-6 font-body">
      <div className="glass-card max-w-2xl w-full p-8 rounded-2xl border border-primary/20 shadow-2xl flex flex-col gap-6 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-4">
          <span className="material-symbols-outlined text-primary text-4xl">vpn_key</span>
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Local AI Setup Required</h2>
            <p className="text-sm text-on-surface-variant/80">Activate on-device models to work with Zero-Knowledge encryption.</p>
          </div>
        </div>

        <div className="bg-surface-container-low/50 border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span>Prompt API (LanguageModel):</span>
            <span className={`px-2 py-0.5 rounded ${isReady(availability?.languageModel) ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
              {isReady(availability?.languageModel) ? '✓ Ready (Installed)' : '⬇ Needs Activation'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Language Detector API:</span>
            <span className={`px-2 py-0.5 rounded ${isReady(availability?.languageDetector) ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
              {isReady(availability?.languageDetector) ? '✓ Ready (Installed)' : '⬇ Needs Activation'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Summarizer API:</span>
            <span className={`px-2 py-0.5 rounded ${isReady(availability?.summarizer) ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
              {isReady(availability?.summarizer) ? '✓ Ready (Installed)' : '⬇ Needs Activation'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Translator API:</span>
            <span className={`px-2 py-0.5 rounded ${isReady(availability?.translator) ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
              {isReady(availability?.translator) ? '✓ Ready (Installed)' : '⬇ Needs Activation'}
            </span>
          </div>
        </div>

        {!setupTriggered ? (
          <div className="flex flex-col gap-4 items-center py-4">
            <span className="material-symbols-outlined text-secondary text-5xl animate-bounce">download</span>
            <p className="text-sm text-center text-on-surface-variant max-w-md">
              To keep your business drafts perfectly secure, this app runs models directly inside Chrome. We will now initialize the local AI core. No data will ever leave your device.
            </p>
            <button
              onClick={onStartSetup}
              className="w-full max-w-sm bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-xl font-bold inner-glow active:scale-[0.98] transition-all hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">bolt</span>
              Activate On-Device AI Models
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-center text-primary animate-pulse">
              Installing AI Core Models...
            </h3>
            
            {/* 各種モデルのダウンロード進捗表示 */}
            <div className="flex flex-col gap-4 py-2">
              {Object.entries(downloadProgress).map(([model, progress]) => (
                <div key={model} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-on-surface-variant">{model}</span>
                    <span className="text-secondary font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden border border-outline-variant/20">
                    <div
                      className="bg-gradient-to-r from-secondary to-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-center text-xs text-on-surface-variant font-mono bg-surface-container-high/40 py-2 rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-sm animate-spin">sync</span>
              <span>Currently handling: {currentDownloadingModel || 'Preparing...'}</span>
            </div>
          </div>
        )}

        <div className="text-center font-mono text-[10px] text-on-surface-variant/40 border-t border-outline-variant/20 pt-4 flex justify-between">
          <span>SECURE SHIELD ACTIVE</span>
          <span>NO NETWORK COMMITTED</span>
        </div>
      </div>
    </div>
  );
}
