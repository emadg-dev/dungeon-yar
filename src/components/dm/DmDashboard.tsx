import React, { useState } from 'react';
import { Campaign, Character, CharacterNote } from '../../types';
import { 
  Users, Heart, Shield, Zap, Sparkles, Moon, Sun, 
  Calendar, Award, Plus, Eye, Dices, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { HPBar } from '../common/HPBar';

interface DmDashboardProps {
  characters: Character[];
  sharedNotes?: CharacterNote[];
  activeCampaign?: Campaign | null;
  onOpenSetupChecklist?: () => void;
  onUpdateCharacter: (char: Character) => void;
  onApplyGroupRest: (type: 'short' | 'long' | 'special') => void;
  onUpdateGroupResources: (delta: { rations?: number; lanternOil?: number }) => void;
  onInspectCharacter: (charId: string) => void;
  onRollDice?: (sides: number, count: number, modifier: number, label: string) => void;
  onCreateForPlayer?: () => void;
}

export const DmDashboard: React.FC<DmDashboardProps> = ({
  characters,
  sharedNotes = [],
  activeCampaign,
  onOpenSetupChecklist,
  onUpdateCharacter,
  onApplyGroupRest,
  onUpdateGroupResources,
  onInspectCharacter,
  onRollDice,
  onCreateForPlayer
}) => {
  const [worldDay, setWorldDay] = useState(14);
  const [worldMonth, setWorldMonth] = useState('آبان');
  const [worldYear, setWorldYear] = useState(412);
  const [secretCheckNotice, setSecretCheckNotice] = useState<string | null>(null);

  const nextDay = () => {
    setWorldDay(prev => prev + 1);
  };

  const adjustHp = (char: Character, delta: number) => {
    const nextCurrent = Math.max(0, Math.min(char.hp.max + (char.hp.temp || 0), char.hp.current + delta));
    onUpdateCharacter({
      ...char,
      hp: { ...char.hp, current: nextCurrent }
    });
  };

  const awardInspiration = (char: Character) => {
    onUpdateCharacter({
      ...char,
      skillPoints: char.skillPoints + 1
    });
  };

  const rollSecretCheck = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const msg = `پرتاب مخفی دانجن مستر: ${d20}`;
    setSecretCheckNotice(msg);
    if (onRollDice) {
      onRollDice(20, 1, 0, 'چک ادراک مخفی مستر (Secret DM Check)');
    }
    setTimeout(() => setSecretCheckNotice(null), 4000);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* World-Date Bar + "Next Day" Button */}
      <div className="surface-card rounded-[14px] p-3.5 flex flex-wrap items-center justify-between gap-3 card-gold-top">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#A39A89] block">گاهشمار زمان زروانیا</span>
            <span className="font-extrabold text-sm text-[#EDE6D8]">
              {worldDay} {worldMonth}، سال {worldYear} عصر شکاف
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={nextDay}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] btn-primary-amber text-xs font-bold transition touch-target"
        >
          <span>روز بعد</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Campaign Setup Checklist (Progress Ring / Shortcut) */}
      <div className="surface-card rounded-[14px] p-3.5 flex items-center justify-between gap-3 border border-[#2F2A23] hover:border-[#E0A030]/40 transition">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E0A030]/15 text-[#F2C265] border border-[#E0A030]/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-[#EDE6D8]">چک‌لیست راه‌اندازی و آمادگی کمپین</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6F9E78]/20 text-[#6F9E78] font-bold">
                {activeCampaign?.wizardState?.completed?.length || 8}/۸ گام
              </span>
            </div>
            <p className="text-[11px] text-[#A39A89] mt-0.5">
              مشخصات، قوانین ۵e، تقویم، جناح‌ها، هیولاها، لوت و جلسه‌ی صفر
            </p>
          </div>
        </div>

        {onOpenSetupChecklist && (
          <button
            type="button"
            onClick={onOpenSetupChecklist}
            className="px-3 py-1.5 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#F2C265] text-xs font-bold transition flex items-center gap-1 min-h-[36px]"
          >
            <span>بازبینی چک‌لیست</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick-Action Bar: Award Inspiration, Add XP, Roll Secret Check, Group Rest */}
      <div className="surface-card rounded-[14px] p-3 space-y-2">
        <span className="text-[11px] font-bold text-[#A39A89] block px-0.5">عملیات سریع گروهی</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={rollSecretCheck}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] text-xs font-bold hover:border-[#E0A030] transition touch-target"
          >
            <Dices className="w-4 h-4 text-[#E0A030]" />
            <span>چک ادراک مخفی</span>
          </button>

          <button
            type="button"
            onClick={() => onApplyGroupRest('short')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] text-xs font-bold hover:border-[#E0A030] transition touch-target"
          >
            <Moon className="w-4 h-4 text-[#E0A030]" />
            <span>استراحت کوتاه گروه</span>
          </button>

          <button
            type="button"
            onClick={() => onApplyGroupRest('long')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] text-xs font-bold hover:border-[#E0A030] transition touch-target"
          >
            <Sun className="w-4 h-4 text-[#E0A030]" />
            <span>استراحت بلند گروه</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateGroupResources({ rations: 1 })}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] text-xs font-bold hover:border-[#E0A030] transition touch-target"
          >
            <Sparkles className="w-4 h-4 text-[#E0A030]" />
            <span>+۱ جیره همگانی</span>
          </button>
        </div>

        {secretCheckNotice && (
          <div className="p-2 rounded-[8px] bg-[#E0A030]/20 border border-[#E0A030] text-[#EDE6D8] text-xs font-bold text-center animate-pulse">
            {secretCheckNotice}
          </div>
        )}
      </div>

      {/* Player Cards in a Strip with Big HP Controls & "Needs Attention" Badge */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#A39A89] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#E0A030]" />
              یاران حاضر در کمپین ({characters.length})
            </h3>
            <span className="text-[10px] text-[#A39A89] hidden sm:inline">• نظارت و مدیریت آنی جان و امتیازات</span>
          </div>
          {onCreateForPlayer && (
            <button
              type="button"
              onClick={onCreateForPlayer}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 hover:bg-[#E0A030]/30 text-xs font-bold transition min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ساخت برای بازیکن (ویزارد)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {characters.map(char => {
            const hasSharedNotes = sharedNotes.some(n => n.characterId === char.id);
            return (
              <div
                key={char.id}
                className="surface-card rounded-[14px] p-3.5 border border-[#2F2A23] transition hover:border-[#2F2A23]/80 space-y-3"
              >
                {/* Header: Portrait, Name, Class & "Needs Attention" Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={char.portraitUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80'}
                      alt={char.name}
                      className="w-11 h-11 rounded-[10px] object-cover border border-[#2F2A23] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-[#EDE6D8] truncate">{char.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 font-bold shrink-0">
                          سطح {char.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A39A89] truncate">
                        {char.className} • AC {char.ac}
                      </p>
                    </div>
                  </div>

                  {/* "Needs Attention" Amber Badge for unread/shared notes */}
                  {hasSharedNotes && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E0A030]/20 text-[#E0A030] border border-[#E0A030]/40 flex items-center gap-1 shrink-0 animate-pulse">
                      <Eye className="w-3 h-3" />
                      نیاز به توجه
                    </span>
                  )}
                </div>

                {/* Big HP Bar with 48px Buttons */}
                <HPBar
                  current={char.hp.current}
                  max={char.hp.max}
                  temp={char.hp.temp}
                  onAdjust={(delta) => adjustHp(char, delta)}
                />

                {/* Actions: Award Inspiration / Inspect */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2F2A23] text-xs">
                  <button
                    type="button"
                    onClick={() => awardInspiration(char)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#E0A030] hover:border-[#E0A030] text-[11px] font-bold transition touch-target"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>اعطای الهام (+۱ مهارت)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onInspectCharacter(char.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] hover:text-[#E0A030] text-[11px] font-bold transition touch-target"
                  >
                    <span>برگه کاراکتر</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
