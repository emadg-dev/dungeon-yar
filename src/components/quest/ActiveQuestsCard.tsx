import React from 'react';
import { Quest } from '../../types';
import { calculateQuestProgress } from '../../../shared/rules/questEngine';
import { Scroll, CheckCircle2, Circle, ChevronLeft, Award, Sparkles, MapPin, Users } from 'lucide-react';

interface ActiveQuestsCardProps {
  quests: Quest[];
  onOpenQuests: () => void;
  onToggleObjective?: (questId: string, objectiveId: string, done: boolean) => void;
  canToggleObjective?: boolean;
}

export const ActiveQuestsCard: React.FC<ActiveQuestsCardProps> = ({
  quests,
  onOpenQuests,
  onToggleObjective,
  canToggleObjective = false,
}) => {
  const activeQuests = quests.filter(q => q.status === 'active');

  if (activeQuests.length === 0) {
    return null;
  }

  return (
    <div className="surface-card rounded-[14px] p-4 border border-[#2F2A23] bg-[#14120E] space-y-3.5 shadow-md" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#2F2A23]/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#E0A030] flex items-center justify-center">
            <Scroll className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#EDE6D8] flex items-center gap-2">
              <span>مأموریت‌های فعال</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E0A030]/20 text-[#E0A030] font-mono font-bold">
                {activeQuests.length}
              </span>
            </h3>
            <p className="text-[10px] text-[#A39A89]">اهداف و مأموریت‌های در جریان ماجراجویی</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenQuests}
          className="text-xs font-bold text-[#E0A030] hover:text-[#F2C265] flex items-center gap-1 transition touch-target py-1 px-2 rounded-[8px] hover:bg-[#E0A030]/10"
        >
          <span>مشاهده همه</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quest Preview Items */}
      <div className="space-y-3">
        {activeQuests.slice(0, 2).map((quest) => {
          const progress = calculateQuestProgress(quest);
          const visibleObjectives = quest.objectives.filter(o => o.visible !== false);

          return (
            <div
              key={quest.id}
              className="p-3 rounded-[12px] bg-[#1A1713] border border-[#2F2A23] hover:border-[#E0A030]/40 transition space-y-2.5"
            >
              {/* Quest Title & Meta */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-[#EDE6D8] leading-tight">{quest.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {quest.giverNpcName && (
                      <span className="text-[10px] text-[#A39A89] flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#A39A89]" />
                        <span>{quest.giverNpcName}</span>
                      </span>
                    )}
                    {quest.locationName && (
                      <span className="text-[10px] text-[#7FB4D6] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#7FB4D6]" />
                        <span>{quest.locationName}</span>
                      </span>
                    )}
                    {quest.rewardRef?.xp ? (
                      <span className="text-[10px] text-[#6F9E78] flex items-center gap-1 font-bold">
                        <Sparkles className="w-3 h-3 text-[#6F9E78]" />
                        <span>+{quest.rewardRef.xp} XP</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Progress Badge */}
                <div className="text-left shrink-0">
                  <span className="text-[11px] font-mono font-bold text-[#E0A030]">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-[#201D19] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-[#C97B4A] to-[#E0A030] rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              {/* Top Visible Objectives Checklist */}
              {visibleObjectives.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {visibleObjectives.slice(0, 3).map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      {canToggleObjective && onToggleObjective ? (
                        <button
                          type="button"
                          onClick={() => onToggleObjective(quest.id, obj.id, !obj.done)}
                          className="shrink-0 text-[#E0A030] hover:text-[#F2C265] touch-target p-1 -m-1"
                          title={obj.done ? 'علامت‌زدن به عنوان ناتمام' : 'علامت‌زدن به عنوان تمام‌شده'}
                        >
                          {obj.done ? (
                            <CheckCircle2 className="w-4 h-4 text-[#6F9E78]" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#A39A89]" />
                          )}
                        </button>
                      ) : (
                        <span className="shrink-0">
                          {obj.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#6F9E78]" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-[#A39A89]" />
                          )}
                        </span>
                      )}
                      <span className={`text-[11px] leading-snug ${obj.done ? 'line-through text-[#6F675A]' : 'text-[#EDE6D8]'}`}>
                        {obj.text}
                      </span>
                    </div>
                  ))}
                  {visibleObjectives.length > 3 && (
                    <div className="text-[10px] text-[#A39A89] pt-0.5">
                      + {visibleObjectives.length - 3} هدف دیگر...
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
