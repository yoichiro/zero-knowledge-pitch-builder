interface AILoadingScreenProps {
  // Props can be expanded if needed
}

export default function AILoadingScreen(_props: AILoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-on-surface p-6 font-body">
      <div className="glass-card p-10 rounded-2xl flex flex-col items-center gap-6 max-w-md w-full border border-primary/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary animate-pulse" />
        <span className="material-symbols-outlined text-primary text-6xl animate-spin">shield_with_heart</span>
        <h2 className="text-2xl font-bold tracking-wider font-mono text-center">INITIALIZING SECURITY ENVIRONMENT</h2>
        <p className="text-sm text-on-surface-variant/80 text-center font-mono">
          Checking on-device hardware thresholds & Chrome Built-in AI APIs...
        </p>
        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
          <div className="bg-primary h-full w-[40%] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
