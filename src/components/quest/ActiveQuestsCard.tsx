import { Button } from '../ui/Button';
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
    <div className="surface-card rounded-[14px] p-4 border border-border bg-bg space-y-3.5 shadow-md" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 gap-2 border-b border-border/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <Scroll className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-text-primary flex items-center gap-2">
              <span>مأموریت‌های فعال</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-accent/20 text-accent font-mono font-bold">
                {activeQuests.length}
              </span>
            </h3>
            <p className="text-xs text-text-muted">اهداف و مأموریت‌های در جریان ماجراجویی</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onOpenQuests}
          className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition touch-target min-w-[44px] py-1 px-2 rounded-[8px] hover:bg-accent/10"
        >
          <span>مشاهده همه</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Quest Preview Items */}
      <div className="space-y-3">
        {activeQuests.slice(0, 2).map((quest) => {
          const progress = calculateQuestProgress(quest);
          const visibleObjectives = quest.objectives.filter(o => o.visible !== false);

          return (
            <div
              key={quest.id}
              className="p-3 rounded-[12px] bg-surface border border-border hover:border-accent/40 transition space-y-2.5"
            >
              {/* Quest Title & Meta */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-text-primary leading-tight">{quest.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {quest.giverNpcName && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Users className="w-3 h-3 text-text-muted" />
                        <span>{quest.giverNpcName}</span>
                      </span>
                    )}
                    {quest.locationName && (
                      <span className="text-xs text-info flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-info" />
                        <span>{quest.locationName}</span>
                      </span>
                    )}
                    {quest.rewardRef?.xp ? (
                      <span className="text-xs text-success flex items-center gap-1 font-bold">
                        <Sparkles className="w-3 h-3 text-success" />
                        <span>+{quest.rewardRef.xp} XP</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Progress Badge */}
                <div className="text-end shrink-0">
                  <span className="text-xs font-mono font-bold text-accent">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-warning to-accent rounded-full transition-all duration-300"
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
                        <Button
                          type="button"
                          onClick={() => onToggleObjective(quest.id, obj.id, !obj.done)}
                          className="shrink-0 text-accent hover:text-accent-hover touch-target min-w-[44px] p-1 -m-1"
                          title={obj.done ? 'علامت‌زدن به عنوان ناتمام' : 'علامت‌زدن به عنوان تمام‌شده'}
                        >
                          {obj.done ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <Circle className="w-4 h-4 text-text-muted" />
                          )}
                        </Button>
                      ) : (
                        <span className="shrink-0">
                          {obj.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-text-muted" />
                          )}
                        </span>
                      )}
                      <span className={`text-xs leading-snug ${obj.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {obj.text}
                      </span>
                    </div>
                  ))}
                  {visibleObjectives.length > 3 && (
                    <div className="text-xs text-text-muted pt-0.5">
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
