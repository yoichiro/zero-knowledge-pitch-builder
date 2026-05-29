export default function Header() {
  return (
    <header className="bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 docked full-width top-0 z-50 shadow-sm flex justify-between items-center w-full px-container-margin py-4 shrink-0">
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
          <div className="security-dot" />
          <span className="font-mono text-xs text-secondary hidden sm:inline">
            🔒 Full Local Secure Mode Active (No external traffic)
          </span>
          <span className="font-mono text-xs text-secondary sm:hidden">
            🔒 Secure Mode Active
          </span>
        </div>
      </div>
    </header>
  );
}
