import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Campaign, MasterCharacter } from '../../types';
import { Shield, Plus, Minus, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface JoinCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  myCharacters: MasterCharacter[];
  preSelectedCharacterId?: string | null;
  onJoin: (data: {
    characterId: string;
    entryMode: 'campaign_start' | 'same_level' | 'new_level';
    entryLevel?: number;
  }) => Promise<void>;
}

export const JoinCampaignModal: React.FC<JoinCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  myCharacters,
  preSelectedCharacterId,
  onJoin
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(
    preSelectedCharacterId || myCharacters[0]?.id || ''
  );
  const [entryMode, setEntryMode] = useState<'campaign_start' | 'same_level' | 'new_level'>('campaign_start');
  const [level, setLevel] = useState<number>(campaign.settings?.startingLevel || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const maxLevel = campaign.settings?.maxEntryLevel || 20;
  const startingLevel = campaign.settings?.startingLevel || 1;
  const requiresApproval = campaign.settings?.approval?.onCreate === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharId) {
      setErrorMsg('لطفاً یک شخصیت انتخاب کنید.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onJoin({
        characterId: selectedCharId,
        entryMode,
        entryLevel: entryMode === 'campaign_start' ? startingLevel : level
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در پیوستن به کمپین.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`پیوستن به ${campaign.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-right" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Character Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">انتخاب شخصیت کلان</label>
          {myCharacters.length === 0 ? (
            <p className="text-xs text-rose-400">ابتدا یک شخصیت در داشبورد ایجاد کنید.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myCharacters.map(char => {
                const isSelected = char.id === selectedCharId;
                return (
                  <div
                    key={char.id}
                    onClick={() => setSelectedCharId(char.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between min-h-[44px] ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={char.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80'}
                        alt={char.name}
                        className="w-8 h-8 rounded-lg object-cover border border-amber-500/20"
                      />
                      <div>
                        <h4 className="text-xs font-bold">{char.name}</h4>
                        <span className="text-[10px] text-slate-400">{char.race}</span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 text-amber-400" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Entry Mode Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">نحوه ورود به کمپین (Entry Mode)</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEntryMode('campaign_start');
                setLevel(startingLevel);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                entryMode === 'campaign_start'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              شروع کمپین (سطح {startingLevel})
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('same_level')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                entryMode === 'same_level'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              با همان سطح قبلی
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('new_level')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                entryMode === 'new_level'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              با سطح سفارشی
            </button>
          </div>
        </div>

        {/* Level Stepper (if new_level or same_level) */}
        {entryMode !== 'campaign_start' && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">سطح ورود شخصیت</span>
              <span className="text-[10px] text-slate-400">حداکثر سطح مجاز کمپین: {maxLevel}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLevel(prev => Math.max(1, prev - 1))}
                disabled={level <= 1}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold text-amber-400 min-w-8 text-center">{level}</span>
              <button
                type="button"
                onClick={() => setLevel(prev => Math.min(maxLevel, prev + 1))}
                disabled={level >= maxLevel}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Approval Notice */}
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
          requiresApproval
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          {requiresApproval ? (
            <>
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>این کمپین نیازمند تأیید دانجن مستر است. پس از ورود، برگه شما در صف تأیید قرار می‌گیرد.</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>ورود مستقیم؛ نیازی به تأیید اولیه دانجن مستر نیست و فوراً آماده بازی می‌شوید.</span>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#2F2A23]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 min-h-[44px]"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedCharId}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center gap-2 min-h-[44px] shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ورود...' : 'ورود به کمپین'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
