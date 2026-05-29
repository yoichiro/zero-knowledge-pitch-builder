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
import type { AppPhase, PersonaType, TimePitchType } from './types';

// Modular UI Components
import AILoadingScreen from './components/AILoadingScreen';
import AISetupScreen from './components/AISetupScreen';
import Header from './components/Header';
import BrainDumpSection from './components/BrainDumpSection';
import WorkspaceSection from './components/WorkspaceSection';
import OutputSection from './components/OutputSection';

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
  }, [brainDump]);

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
    setPitch(prev => ({ ...prev, [field]: val }));
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
    return <AILoadingScreen />;
  }

  // ==========================================
  // RENDER PHASE: 2. Setup & Model Downloader
  // ==========================================
  if (phase === 'setup') {
    return (
      <AISetupScreen
        availability={availability}
        setupTriggered={setupTriggered}
        downloadProgress={downloadProgress}
        currentDownloadingModel={currentDownloadingModel}
        onStartSetup={handleStartSetup}
      />
    );
  }

  // ==========================================
  // RENDER PHASE: 3. Main Dashboard (3-Column)
  // ==========================================
  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex flex-col overflow-hidden">
      <Header />

      {/* 3-Column Workspace Main Area */}
      <main className="flex flex-col lg:flex-row h-[calc(100vh-72px)] overflow-hidden">
        
        {/* Left Column: Brain Dump & Reviews */}
        <BrainDumpSection
          brainDump={brainDump}
          setBrainDump={setBrainDump}
          detectedLang={detectedLang}
          setIsDetectingLang={setIsDetectingLang}
          setDetectedLang={setDetectedLang}
          isDetectingLang={isDetectingLang}
          isStructuring={isStructuring}
          activePersona={activePersona}
          setActivePersona={setActivePersona}
          reviews={reviews}
          isReviewing={isReviewing}
          backgroundAIProgress={backgroundAIProgress}
          backgroundAIPercent={backgroundAIPercent}
          onStructurePitch={handleStructurePitchAction}
        />

        {/* Middle Column: Workspace (Pitch Cards Grid) */}
        <WorkspaceSection
          pitch={pitch}
          structuringFields={structuringFields}
          onCardChange={handleCardChange}
          onApplyChanges={handleApplyWorkspaceChanges}
        />

        {/* Right Column: Summarization, Translation, and Export */}
        <OutputSection
          timePitches={timePitches}
          activeTime={activeTime}
          isSummarizing={isSummarizing}
          backgroundAIProgress={backgroundAIProgress}
          backgroundAIPercent={backgroundAIPercent}
          translationResult={translationResult}
          isTranslating={isTranslating}
          activeTransLang={activeTransLang}
          onTimeChange={handleTimeChange}
          onTranslateAction={handleTranslateAction}
          onCopyToClipboard={handleCopyToClipboard}
          onRefreshSummaries={() => updateSummariesAndReviews(pitch)}
          onSaveLocally={handleSaveLocally}
        />

      </main>
    </div>
  );
}
