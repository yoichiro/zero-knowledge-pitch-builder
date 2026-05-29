import type { StructuredPitch } from '../types';
import PitchCard from './PitchCard';

interface WorkspaceSectionProps {
  pitch: StructuredPitch;
  structuringFields: Record<keyof StructuredPitch, boolean>;
  onCardChange: (field: keyof StructuredPitch, val: string) => void;
  onApplyChanges: () => void;
}

export default function WorkspaceSection({
  pitch,
  structuringFields,
  onCardChange,
  onApplyChanges,
}: WorkspaceSectionProps) {
  const cards: Array<{
    field: keyof StructuredPitch;
    label: string;
    icon: string;
  }> = [
    { field: 'hook', label: 'Hook', icon: 'bolt' },
    { field: 'problem', label: 'Problem', icon: 'error_outline' },
    { field: 'solution', label: 'Solution', icon: 'lightbulb' },
    { field: 'valueProp', label: 'Value Prop', icon: 'trending_up' },
    { field: 'competitors', label: 'Competitors', icon: 'group' },
    { field: 'differentiators', label: 'Differentiators', icon: 'workspace_premium' },
  ];

  return (
    <section className="w-full lg:w-[40%] border-r border-outline-variant/30 p-6 flex flex-col gap-6 overflow-hidden h-full shrink-0">
      <div className="flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">edit_note</span> Workspace
          </h2>
          <p className="text-xs text-on-surface-variant opacity-70">Refine automatically extracted components</p>
        </div>
        <button
          onClick={onApplyChanges}
          className="px-3 py-1.5 rounded-lg border border-secondary/40 text-secondary hover:bg-secondary/10 transition-colors text-xs font-mono flex items-center gap-1.5"
          title="Apply workspace modifications to Summaries and Persona Reviews"
        >
          <span className="material-symbols-outlined text-xs">sync_alt</span> Apply Changes
        </button>
      </div>

      {/* Pitch Cards Matrix (6 Cards - 2-Column Responsive Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {cards.map((card) => (
          <PitchCard
            key={card.field}
            field={card.field}
            label={card.label}
            icon={card.icon}
            value={pitch[card.field]}
            isStructuring={structuringFields[card.field]}
            onChange={(val) => onCardChange(card.field, val)}
          />
        ))}
      </div>
    </section>
  );
}
