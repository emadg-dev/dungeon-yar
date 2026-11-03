import React from 'react';
import { Character } from '../../types';
import { Sparkles, Layers } from 'lucide-react';
import { deriveSheet } from '../../../shared/rules/engine';
import { PipTracker } from '../common/PipTracker';

interface ResourcesTabProps {
  character: Character;
  onUpdate: (updated: Character) => void;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({ character, onUpdate }) => {
  const derived = deriveSheet({ character });
  const toggleCustomResource = (id: string, index: number) => {
    const updated = character.customResources.map(r => {
      if (r.id === id) {
        const next = index < r.current ? index : index + 1;
        return { ...r, current: Math.max(0, Math.min(r.max, next)) };
      }
      return r;
    });
    onUpdate({ ...character, customResources: updated });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="surface-card rounded-[14px] p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-[#2F2A23] pb-2">
          <Layers className="w-4 h-4 text-[#E0A030]" />
          <h3 className="text-xs font-bold text-[#EDE6D8]">منابع و پیپ‌ها</h3>
        </div>
        {character.customResources && character.customResources.length > 0 ? (
          <div className="space-y-3">
            {character.customResources.map(res => (
              <PipTracker
                key={res.id}
                label={res.name}
                current={res.current}
                max={res.max}
                resetType="long"
                onToggle={(idx) => toggleCustomResource(res.id, idx)}
              />
            ))}
          </div>
        ) : Object.keys(derived.classResources || {}).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(derived.classResources || {}).map(([k, res]: [string, any]) => (
              <PipTracker
                key={k}
                label={`${res.name}${res.currentDice ? ` (${res.currentDice})` : ''}`}
                current={res.max}
                max={Math.max(1, res.max)}
                resetType={(res.resetType as any) || 'short'}
                onToggle={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-xs text-[#A39A89]">
            <PipTracker label="شکاف واقعیت / مومنت پوینت" current={Math.min(3, character.level)} max={Math.max(3, character.level)} resetType="short" onToggle={() => {}} />
            <PipTracker label="فرسودگی جادو / تابش فره" current={2} max={4} resetType="long" onToggle={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
};
