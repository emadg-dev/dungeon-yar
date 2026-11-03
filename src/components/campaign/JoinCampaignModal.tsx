import { Button } from '../ui/Button';
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
  onOpenWizard?: () => void;
}

export const JoinCampaignModal: React.FC<JoinCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  myCharacters,
  preSelectedCharacterId,
  onJoin,
  onOpenWizard
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
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-start" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs">
            {errorMsg}
          </div>
        )}

        {/* Character Selection */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="text-xs font-bold text-text-primary">انتخاب شخصیت کلان</label>
            {onOpenWizard && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWizard();
                }}
                className="text-xs font-bold text-accent-hover hover:underline flex items-center gap-1 min-h-[44px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>یا ساخت شخصیت با ویزارد</span>
              </Button>
            )}
          </div>
          {myCharacters.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface border border-dashed border-border text-center space-y-2">
              <p className="text-xs text-text-muted">شما هنوز شخصیتی ثبت نکرده‌اید.</p>
              {onOpenWizard && (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWizard();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  ساخت شخصیت با ویزارد 8 مرحله‌ای
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myCharacters.map(char => {
                const isSelected = char.id === selectedCharId;
                return (
                  <div
                    key={char.id}
                    onClick={() => setSelectedCharId(char.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-wrap items-center justify-between gap-2 min-h-[44px] ${
                      isSelected
                        ? 'bg-accent/20 border-accent text-accent-hover'
                        : 'bg-bg/60 border-border text-text-primary hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={char.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80'}
                        alt={char.name}
                        loading="lazy"
                        decoding="async"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-lg object-cover border border-accent/20"
                      />
                      <div>
                        <h4 className="text-xs font-bold">{char.name}</h4>
                        <span className="text-xs text-text-muted">{char.race}</span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 text-accent-hover" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Entry Mode Selection */}
        <div>
          <label className="block text-xs font-bold text-text-primary mb-2">نحوه ورود به کمپین (Entry Mode)</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              type="button"
              onClick={() => {
                setEntryMode('campaign_start');
                setLevel(startingLevel);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                entryMode === 'campaign_start'
                  ? 'bg-accent/20 border-accent text-accent-hover'
                  : 'bg-bg/60 border-border text-text-muted hover:border-border-strong'
              }`}
            >
              شروع کمپین (سطح {startingLevel})
            </Button>
            <Button
              type="button"
              onClick={() => setEntryMode('same_level')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                entryMode === 'same_level'
                  ? 'bg-accent/20 border-accent text-accent-hover'
                  : 'bg-bg/60 border-border text-text-muted hover:border-border-strong'
              }`}
            >
              با همان سطح قبلی
            </Button>
            <Button
              type="button"
              onClick={() => setEntryMode('new_level')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                entryMode === 'new_level'
                  ? 'bg-accent/20 border-accent text-accent-hover'
                  : 'bg-bg/60 border-border text-text-muted hover:border-border-strong'
              }`}
            >
              با سطح سفارشی
            </Button>
          </div>
        </div>

        {/* Level Stepper (if new_level or same_level) */}
        {entryMode !== 'campaign_start' && (
          <div className="p-3.5 rounded-xl bg-bg border border-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-text-primary block">سطح ورود شخصیت</span>
              <span className="text-xs text-text-muted">حداکثر سطح مجاز کمپین: {maxLevel}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => setLevel(prev => Math.max(1, prev - 1))}
                disabled={level <= 1}
                className="w-9 h-9 rounded-xl bg-surface-2 hover:bg-surface-2 text-text-primary disabled:opacity-40 flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-bold text-accent-hover min-w-8 text-center">{level}</span>
              <Button
                type="button"
                onClick={() => setLevel(prev => Math.min(maxLevel, prev + 1))}
                disabled={level >= maxLevel}
                className="w-9 h-9 rounded-xl bg-surface-2 hover:bg-surface-2 text-text-primary disabled:opacity-40 flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Approval Notice */}
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
          requiresApproval
            ? 'bg-accent/10 border-accent/30 text-accent-hover'
            : 'bg-success/10 border-success/30 text-success'
        }`}>
          {requiresApproval ? (
            <>
              <AlertCircle className="w-4 h-4 shrink-0 text-accent-hover" />
              <span>این کمپین نیازمند تأیید دانجن مستر است. پس از ورود، برگه شما در صف تأیید قرار می‌گیرد.</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 shrink-0 text-success" />
              <span>ورود مستقیم؛ نیازی به تأیید اولیه دانجن مستر نیست و فوراً آماده بازی می‌شوید.</span>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary min-h-[44px]"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedCharId}
            className="px-5 py-2.5 rounded-xl bg-accent text-on-accent font-bold text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2 min-h-[44px] shadow-lg shadow-accent/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ورود...' : 'ورود به کمپین'}</span>
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
