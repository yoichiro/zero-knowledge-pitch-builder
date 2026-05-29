import type { StructuredPitch } from '../types';

interface PitchCardProps {
  field: keyof StructuredPitch;
  label: string;
  icon: string;
  value: string;
  isStructuring: boolean;
  onChange: (val: string) => void;
}

export default function PitchCard({
  field,
  label,
  icon,
  value,
  isStructuring,
  onChange,
}: PitchCardProps) {
  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-2 group hover:border-primary/50 transition-all relative overflow-hidden min-h-[140px]">
      <span className="material-symbols-outlined absolute top-3 right-3 text-xs text-on-surface-variant/40 group-hover:text-primary transition-colors">edit</span>
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5 shrink-0">
        <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">{label}</label>
        <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary mr-5">{icon}</span>
      </div>
      <textarea
        value={value}
        disabled={isStructuring}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none flex-grow min-h-0 text-on-surface placeholder:text-on-surface-variant/30"
        placeholder={`${label}: Add details...`}
      />
      {isStructuring ? (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-secondary gap-2 z-10 animate-pulse">
          <span className="animate-spin material-symbols-outlined">sync</span>
          Structuring via local models...
        </div>
      ) : null}
    </div>
  );
}
