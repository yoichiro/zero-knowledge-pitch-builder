import { useState, useEffect, useRef } from 'react';
import {
  checkAIAvailability,
  prepareAIModels,
  detectLanguage,
  structurePitch,
  generatePersonaReview,
  generateTimePitch,
  translatePitch
} from './utils/chromeAI';
import type {
  StructuredPitch,
  PersonaReview,
  AIAvailability
} from './utils/chromeAI';

type AppPhase = 'checking' | 'setup' | 'dashboard';
type PersonaType = 'investor' | 'executive' | 'general';
type TimePitchType = '15' | '30' | '60';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function App() {
  // アプリ全体の動作フェーズ
  const [phase, setPhase] = useState<AppPhase>('checking');
  
  // AIモデル準備ステート
  const [availability, setAvailability] = useState<AIAvailability | null>(null);
  const [setupTriggered, setSetupTriggered] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({
    LanguageDetector: 0,
    LanguageModel: 0,
    Summarizer: 0,
    Translator: 0,
  });
  const [currentDownloadingModel, setCurrentDownloadingModel] = useState<string>('');

  // ダッシュボード用データステート
  const [brainDump, setBrainDump] = useState<string>('');
  const [detectedLang, setDetectedLang] = useState<string>('--');
  const [isDetectingLang, setIsDetectingLang] = useState<boolean>(false);
  
  // 構造化されたピッチ
  const [pitch, setPitch] = useState<StructuredPitch>({
    hook: '',
    problem: '',
    solution: '',
    valueProp: '',
    competitors: '',
    differentiators: '',
  });
  const [isStructuring, setIsStructuring] = useState<boolean>(false);
  const [structuringFields, setStructuringFields] = useState<Record<keyof StructuredPitch, boolean>>({
    hook: false,
    problem: false,
    solution: false,
    valueProp: false,
    competitors: false,
    differentiators: false,
  });

  // 仮想レビュー用ステート
  const [activePersona, setActivePersona] = useState<PersonaType>('investor');
  const [reviews, setReviews] = useState<Record<PersonaType, PersonaReview>>({
    investor: { review: 'Write something in the Brain Dump and analyze it first!', suggestion: '' },
    executive: { review: 'Write something in the Brain Dump and analyze it first!', suggestion: '' },
    general: { review: 'Write something in the Brain Dump and analyze it first!', suggestion: '' },
  });
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  // アウトプット用ステート
  const [activeTime, setActiveTime] = useState<TimePitchType>('30');
  const [timePitches, setTimePitches] = useState<Record<TimePitchType, string>>({
    '15': 'Your summary will appear here...',
    '30': 'Your summary will appear here...',
    '60': 'Your summary will appear here...',
  });
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // 翻訳用ステート
  const [activeTransLang, setActiveTransLang] = useState<'en' | 'ja'>('en');
  const [translationResult, setTranslationResult] = useState<string>('Translation results will appear here...');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // バックグラウンドAIタスクの進捗状況
  const [backgroundAIProgress, setBackgroundAIProgress] = useState<string>('');
  const [backgroundAIPercent, setBackgroundAIPercent] = useState<number>(0);

  // 言語検出用のDebounceタイマー
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初回起動時のAIモデルチェック
  useEffect(() => {
    async function initCheck() {
      await delay(1000); // 演出用少しのディレイ
      const avail = await checkAIAvailability();
      setAvailability(avail);

      const isReady = (status: string) => status === 'readily' || status === 'available';

      // すでに利用可能 ('readily' または 'available') であれば、セットアップをスキップして直接ダッシュボードへ
      if (
        isReady(avail.languageModel) &&
        isReady(avail.languageDetector) &&
        isReady(avail.summarizer) &&
        isReady(avail.translator)
      ) {
        setPhase('dashboard');
      } else {
        setPhase('setup');
      }
    }
    initCheck();
  }, []);

  // 言語自動検知 (Brain Dump 入力時にトリガー - 非同期AI処理に専念)
  useEffect(() => {
    let active = true;

    if (detectTimerRef.current !== null) {
      clearTimeout(detectTimerRef.current);
      detectTimerRef.current = null;
    }

    if (brainDump.trim()) {
      detectTimerRef.current = setTimeout(async () => {
        try {
          const detected = await detectLanguage(brainDump);
          if (active) {
            setDetectedLang(detected);
          }
        } catch (e) {
          console.error('Language detection failed:', e);
          if (active) {
            setDetectedLang('Unavailable');
          }
        } finally {
          if (active) {
            setIsDetectingLang(false);
          }
        }
      }, 500); // 500msのデバウンス
    }

    return () => {
      active = false;
      if (detectTimerRef.current !== null) {
        clearTimeout(detectTimerRef.current);
      }
    };
  }, [brainDump, setDetectedLang, setIsDetectingLang]);

  // ピッチが更新されたら要約とレビューを並行して更新する
  const updateSummariesAndReviews = async (newPitch: StructuredPitch) => {
    if (!newPitch.hook && !newPitch.problem && !newPitch.solution && !newPitch.valueProp) return;

    setIsSummarizing(true);
    setIsReviewing(true);
    setBackgroundAIProgress('Starting background analysis...');
    setBackgroundAIPercent(0);

    try {
      let completed = 0;
      const totalSteps = 6;
      const updateProgress = (stepName: string) => {
        completed++;
        const percent = Math.round((completed / totalSteps) * 100);
        setBackgroundAIProgress(`Analyzing... ${stepName} (${completed}/${totalSteps})`);
        setBackgroundAIPercent(percent);
      };

      // 各タスクを並行で走らせつつ、完了順に進捗をアップデート！
      const p15Promise = generateTimePitch(newPitch, '15').then(res => { updateProgress('15s Summary'); return res; });
      const p30Promise = generateTimePitch(newPitch, '30').then(res => { updateProgress('30s Summary'); return res; });
      const p60Promise = generateTimePitch(newPitch, '60').then(res => { updateProgress('60s Summary'); return res; });
      const invPromise = generatePersonaReview(newPitch, 'investor', detectedLang).then(res => { updateProgress('Investor Feedback'); return res; });
      const exePromise = generatePersonaReview(newPitch, 'executive', detectedLang).then(res => { updateProgress('Executive Feedback'); return res; });
      const genPromise = generatePersonaReview(newPitch, 'general', detectedLang).then(res => { updateProgress('Consumer Feedback'); return res; });

      // すべてのバックグラウンドAI処理を並行実行で同時に待つ！
      const [p15, p30, p60, revInvestor, revExecutive, revGeneral] = await Promise.all([
        p15Promise,
        p30Promise,
        p60Promise,
        invPromise,
        exePromise,
        genPromise,
      ]);
      
      setTimePitches({
        '15': p15,
        '30': p30,
        '60': p60,
      });

      setReviews({
        investor: revInvestor,
        executive: revExecutive,
        general: revGeneral,
      });

      // 3. 選択言語への初期翻訳結果もついでに更新
      setIsTranslating(true);
      const activeSummary = activeTime === '15' ? p15 : activeTime === '30' ? p30 : p60;
      const transResult = await translatePitch(activeSummary, activeTransLang);
      setTranslationResult(transResult);
      setIsTranslating(false);

    } catch (e) {
      console.error('Failed to run background AI tasks:', e);
    } finally {
      setIsSummarizing(false);
      setIsReviewing(false);
    }
  };

  // 1. AIモデルセットアップ開始
  const handleStartSetup = async () => {
    if (!availability) return;
    setSetupTriggered(true);

    await prepareAIModels(availability, (model, progress) => {
      setCurrentDownloadingModel(model);
      setDownloadProgress(prev => ({
        ...prev,
        [model]: progress
      }));
    });

    await delay(500); // 終わってからの余韻
    setPhase('dashboard');
  };

  // 2. AIで構造化・分析ボタンクリック
  const handleStructurePitchAction = async () => {
    if (!brainDump.trim()) return;
    setIsStructuring(true);
    setStructuringFields({
      hook: true,
      problem: true,
      solution: true,
      valueProp: true,
      competitors: true,
      differentiators: true,
    });

    try {
      const extracted = await structurePitch(brainDump, detectedLang, (field, val) => {
        // 各フィールドの推論が終わるたびにUIへ順次即時反映！
        setPitch(prev => ({
          ...prev,
          [field]: val
        }));
        setStructuringFields(prev => ({
          ...prev,
          [field]: false
        }));
      });
      
      // 全体が完了した後の最終結果確定
      setPitch(extracted);
    } catch (e: unknown) {
      console.error('Structuring failed:', e);
      const errMsg = e instanceof Error ? e.message : String(e);
      alert(`AI Structuring Failed!\n\nReason: ${errMsg}\n\nTo run this local AI application, please ensure Chrome Built-in AI APIs (LanguageModel, Summarizer, Translator, etc.) are enabled in your browser settings.`);
    } finally {
      setIsStructuring(false);
      setStructuringFields({
        hook: false,
        problem: false,
        solution: false,
        valueProp: false,
        competitors: false,
        differentiators: false,
      });
    }
  };

  // 3. 手動でWorkspaceのカードを入力変更した時の処理
  const handleCardChange = (field: keyof StructuredPitch, val: string) => {
    const updated = { ...pitch, [field]: val };
    setPitch(updated);
    // 入力が終わった段階で、再度自動要約やレビューを再生成可能
  };

  // 手動でWorkspaceの値を手動更新して要約/レビューに反映させるボタン
  const handleApplyWorkspaceChanges = async () => {
    await updateSummariesAndReviews(pitch);
  };

  // 4. 翻訳言語切り替え ＆ 更新
  const handleTranslateAction = async (targetLang: 'en' | 'ja') => {
    setActiveTransLang(targetLang);
    setIsTranslating(true);

    const activeSummary = timePitches[activeTime];
    if (activeSummary && activeSummary !== 'Your summary will appear here...') {
      const res = await translatePitch(activeSummary, targetLang);
      setTranslationResult(res);
    } else {
      setTranslationResult('Translation target summary is empty. Analyze raw ideas first.');
    }
    setIsTranslating(false);
  };

  // 5. 要約時間切り替え
  const handleTimeChange = async (time: TimePitchType) => {
    setActiveTime(time);
    // 時間を切り替えたら、それに合わせて翻訳結果も更新
    setIsTranslating(true);
    const activeSummary = timePitches[time];
    if (activeSummary && activeSummary !== 'Your summary will appear here...') {
      const res = await translatePitch(activeSummary, activeTransLang);
      setTranslationResult(res);
    }
    setIsTranslating(false);
  };

  // 6. JSON暗号化ローカル保存
  const handleSaveLocally = () => {
    const exportData = {
      title: 'Zero-Knowledge Pitch Export',
      exportedAt: new Date().toISOString(),
      security: 'Encrypted via Zero-Knowledge On-Device Session (Simulated)',
      brainDump,
      detectedLang,
      structuredPitch: pitch,
      timePitches,
      personaReviews: {
        investor: reviews.investor.review,
        executive: reviews.executive.review,
        general: reviews.general.review,
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zk-pitch-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // テキストのコピークリップボード
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard! 📋✨');
  };

  // ==========================================
  // RENDER PHASE: 1. Checking / Loading
  // ==========================================
  if (phase === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-on-surface p-6 font-body">
        <div className="glass-card p-10 rounded-2xl flex flex-col items-center gap-6 max-w-md w-full border border-primary/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary animate-pulse"></div>
          <span className="material-symbols-outlined text-primary text-6xl animate-spin">shield_with_heart</span>
          <h2 className="text-2xl font-bold tracking-wider font-mono text-center">INITIALIZING SECURITY ENVIRONMENT</h2>
          <p className="text-sm text-on-surface-variant/80 text-center font-mono">
            Checking on-device hardware thresholds & Chrome Built-in AI APIs...
          </p>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[40%] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER PHASE: 2. Setup & Model Downloader
  // ==========================================
  if (phase === 'setup') {


    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-on-surface p-6 font-body">
        <div className="glass-card max-w-2xl w-full p-8 rounded-2xl border border-primary/20 shadow-2xl flex flex-col gap-6 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>

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
              <span className={`px-2 py-0.5 rounded ${(availability?.languageModel === 'readily' || availability?.languageModel === 'available') ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                {(availability?.languageModel === 'readily' || availability?.languageModel === 'available') ? '✓ Ready (Installed)' : '⬇ Needs Activation'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Language Detector API:</span>
              <span className={`px-2 py-0.5 rounded ${(availability?.languageDetector === 'readily' || availability?.languageDetector === 'available') ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                {(availability?.languageDetector === 'readily' || availability?.languageDetector === 'available') ? '✓ Ready (Installed)' : '⬇ Needs Activation'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Summarizer API:</span>
              <span className={`px-2 py-0.5 rounded ${(availability?.summarizer === 'readily' || availability?.summarizer === 'available') ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                {(availability?.summarizer === 'readily' || availability?.summarizer === 'available') ? '✓ Ready (Installed)' : '⬇ Needs Activation'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Translator API:</span>
              <span className={`px-2 py-0.5 rounded ${(availability?.translator === 'readily' || availability?.translator === 'available') ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                {(availability?.translator === 'readily' || availability?.translator === 'available') ? '✓ Ready (Installed)' : '⬇ Needs Activation'}
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
                onClick={handleStartSetup}
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
                      ></div>
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

  // ==========================================
  // RENDER PHASE: 3. Main Dashboard (3-Column)
  // ==========================================
  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex flex-col overflow-hidden">
      {/* 1. Header (Stitch Design) */}
      <header className="bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 docked full-width top-0 z-50 shadow-sm flex justify-between items-center w-full px-container-margin py-4">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield_with_heart
          </span>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface">Zero-Knowledge Pitch Builder</h1>
            <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase">On-Device AI Pitch Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 px-4 py-2 rounded-full">
            <div className="security-dot"></div>
            <span className="font-mono text-xs text-secondary hidden sm:inline">
              🔒 Full Local Secure Mode Active (No external traffic)
            </span>
            <span className="font-mono text-xs text-secondary sm:hidden">
              🔒 Secure Mode Active
            </span>
          </div>
        </div>
      </header>

      {/* 3-Column Workspace Main Area */}
      <main className="flex flex-col lg:flex-row h-[calc(100vh-72px)] overflow-hidden">
        
        {/* 2. Left Column: Brain Dump (Input) */}
        <section className="w-full lg:w-[30%] border-r border-outline-variant/30 p-6 flex flex-col gap-6 bg-surface-container-low/30 overflow-hidden h-full">
          <div className="flex justify-between items-start">
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

          <div className="flex flex-col gap-2">
            <button
              onClick={handleStructurePitchAction}
              disabled={
                isStructuring || 
                !brainDump.trim() || 
                isDetectingLang || 
                (detectedLang !== 'Japanese' && detectedLang !== 'English')
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
            {brainDump.trim() && !isDetectingLang && detectedLang !== 'Japanese' && detectedLang !== 'English' && (
              <p className="text-center text-xs text-rose-500 font-semibold animate-pulse">
                ⚠️ Only Japanese and English inputs are supported.
              </p>
            )}
            <p className="text-center text-[10px] text-on-surface-variant/60 font-mono">
              Automatically segments your ideas on-device
            </p>
          </div>

          {/* Virtual Persona Review */}
          <div className="flex-grow flex flex-col gap-4 min-h-[150px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-outline-variant/20 pt-4">
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
                    ></div>
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

        {/* 3. Middle Column: Workspace (AI Refinement) */}
        <section className="w-full lg:w-[40%] border-r border-outline-variant/30 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">edit_note</span> Workspace
              </h2>
              <p className="text-xs text-on-surface-variant opacity-70">Refine automatically extracted components</p>
            </div>
            <button
              onClick={handleApplyWorkspaceChanges}
              className="px-3 py-1.5 rounded-lg border border-secondary/40 text-secondary hover:bg-secondary/10 transition-colors text-xs font-mono flex items-center gap-1.5"
              title="Apply workspace modifications to Summaries and Persona Reviews"
            >
              <span className="material-symbols-outlined text-xs">sync_alt</span> Apply Changes
            </button>
          </div>

          {/* Pitch Cards Matrix (6 Cards - 2-Column Responsive Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-1">
            
            {/* Hook */}
            <div className="glass-card p-4 rounded-xl flex flex-col gap-2 group hover:border-primary/50 transition-all relative overflow-hidden min-h-[140px]">
              <span className="material-symbols-outlined absolute top-3 right-3 text-xs text-on-surface-variant/40 group-hover:text-primary transition-colors">edit</span>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Hook</label>
                <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary mr-5">bolt</span>
              </div>
              <textarea
                value={pitch.hook}
                disabled={structuringFields.hook}
                onChange={(e) => handleCardChange('hook', e.target.value)}
                className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none flex-1 min-h-0 text-on-surface placeholder:text-on-surface-variant/30"
                placeholder="Hook: Attention-grabbing opening statement..."
              />
              {structuringFields.hook ? (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-secondary gap-2 z-10 animate-pulse">
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Structuring via local models...
                </div>
              ) : null}
            </div>

            {/* Problem */}
            <div className="glass-card p-4 rounded-xl flex flex-col gap-2 group hover:border-primary/50 transition-all relative overflow-hidden min-h-[140px]">
              <span className="material-symbols-outlined absolute top-3 right-3 text-xs text-on-surface-variant/40 group-hover:text-primary transition-colors">edit</span>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Problem</label>
                <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary mr-5">error_outline</span>
              </div>
              <textarea
                value={pitch.problem}
                disabled={structuringFields.problem}
                onChange={(e) => handleCardChange('problem', e.target.value)}
                className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none flex-1 min-h-0 text-on-surface placeholder:text-on-surface-variant/30"
                placeholder="Problem: What crucial problem are you solving?..."
              />
              {structuringFields.problem ? (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-secondary gap-2 z-10 animate-pulse">
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Structuring via local models...
                </div>
              ) : null}
            </div>

            {/* Solution */}
            <div className="glass-card p-4 rounded-xl flex flex-col gap-2 group hover:border-primary/50 transition-all relative overflow-hidden min-h-[140px]">
              <span className="material-symbols-outlined absolute top-3 right-3 text-xs text-on-surface-variant/40 group-hover:text-primary transition-colors">edit</span>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Solution</label>
                <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary mr-5">lightbulb</span>
              </div>
              <textarea
                value={pitch.solution}
                disabled={structuringFields.solution}
                onChange={(e) => handleCardChange('solution', e.target.value)}
                className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none flex-1 min-h-0 text-on-surface placeholder:text-on-surface-variant/30"
                placeholder="Solution: Describe your product or service..."
              />
              {structuringFields.solution ? (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-secondary gap-2 z-10 animate-pulse">
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Structuring via local models...
                </div>
              ) : null}
            </div>

            {/* Value Prop */}
            <div className="glass-card p-4 rounded-xl flex flex-col gap-2 group hover:border-primary/50 transition-all relative overflow-hidden min-h-[140px]">
              <span className="material-symbols-outlined absolute top-3 right-3 text-xs text-on-surface-variant/40 group-hover:text-primary transition-colors">edit</span>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Value Prop</label>
                <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary mr-5">trending_up</span>
              </div>
              <textarea
                value={pitch.valueProp}
                disabled={structuringFields.valueProp}
                onChange={(e) => handleCardChange('valueProp', e.target.value)}
                className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none flex-1 min-h-0 text-on-surface placeholder:text-on-surface-variant/30"
                placeholder="Value Prop: Why choose you? Absolute value..."
              />
              {structuringFields.valueProp ? (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-secondary gap-2 z-10 animate-pulse">
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Structuring via local models...
                </div>
              ) : null}
            </div>

            {/* Competitors */}
            <div className="glass-card p-4 rounded-xl flex flex-col gap-2 group hover:border-primary/50 transition-all relative overflow-hidden min-h-[140px]">
              <span className="material-symbols-outlined absolute top-3 right-3 text-xs text-on-surface-variant/40 group-hover:text-primary transition-colors">edit</span>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Competitors</label>
                <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary mr-5">group</span>
              </div>
              <textarea
                value={pitch.competitors}
                disabled={structuringFields.competitors}
                onChange={(e) => handleCardChange('competitors', e.target.value)}
                className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none flex-1 min-h-0 text-on-surface placeholder:text-on-surface-variant/30"
                placeholder="Competitors: Who are your key competitors?..."
              />
              {structuringFields.competitors ? (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-secondary gap-2 z-10 animate-pulse">
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Structuring via local models...
                </div>
              ) : null}
            </div>

            {/* Differentiators */}
            <div className="glass-card p-4 rounded-xl flex flex-col gap-2 group hover:border-primary/50 transition-all relative overflow-hidden min-h-[140px]">
              <span className="material-symbols-outlined absolute top-3 right-3 text-xs text-on-surface-variant/40 group-hover:text-primary transition-colors">edit</span>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Differentiators</label>
                <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary mr-5">workspace_premium</span>
              </div>
              <textarea
                value={pitch.differentiators}
                disabled={structuringFields.differentiators}
                onChange={(e) => handleCardChange('differentiators', e.target.value)}
                className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none flex-1 min-h-0 text-on-surface placeholder:text-on-surface-variant/30"
                placeholder="Differentiators: Why are you better than others?..."
              />
              {structuringFields.differentiators ? (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-secondary gap-2 z-10 animate-pulse">
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Structuring via local models...
                </div>
              ) : null}
            </div>
            
          </div>

        </section>

        {/* 4. Right Column: Output Area */}
        <section className="w-full lg:w-[30%] p-6 flex flex-col gap-6 bg-surface-container-low/30 overflow-y-auto custom-scrollbar">
          <div>
            <h2 className="text-xl font-bold text-tertiary flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">send</span> Output
            </h2>
            <p className="text-xs text-on-surface-variant opacity-70">Final refined deliverables</p>
          </div>

          {/* Time-based Pitch Generation */}
          <div className="flex flex-col gap-2 flex-grow basis-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface">Time-based Pitch Generation</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyToClipboard(timePitches[activeTime])}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold text-on-surface-variant hover:text-primary hover:bg-primary/10 border border-outline-variant/20 transition-all active:scale-95 shadow-sm"
                  title="Copy to Clipboard"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span> Copy
                </button>
                <button 
                  onClick={() => updateSummariesAndReviews(pitch)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold text-on-surface-variant hover:text-tertiary hover:bg-tertiary/10 border border-outline-variant/20 transition-all"
                >
                  <span className="material-symbols-outlined text-xs">refresh</span> Re-Gen
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex bg-surface-container-high rounded-lg p-0.5 border border-outline-variant/30 w-fit">
                {(['15', '30', '60'] as TimePitchType[]).map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeChange(time)}
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
                    ></div>
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
          <div className="flex flex-col gap-2 flex-grow basis-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface">Multi-language Translation</label>
              <button 
                onClick={() => handleTranslateAction(activeTransLang)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase font-bold text-on-surface-variant hover:text-tertiary transition-colors"
              >
                <span className="material-symbols-outlined text-xs">refresh</span> Re-Translate
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex gap-2">
                {(['en', 'ja'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleTranslateAction(lang)}
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
          <div className="mt-auto pt-4 border-t border-outline-variant/20">
            <button
              onClick={handleSaveLocally}
              className="w-full border border-secondary/40 text-secondary hover:bg-secondary/10 font-mono text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-sm">lock_open</span>
              Save Locally Encrypted (JSON)
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
