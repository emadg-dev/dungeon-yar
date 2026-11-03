import { Button } from '../ui/Button';
import React from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Campaign } from '../../types';
import { Compass, Home, Shield, ChevronLeft, Plus } from 'lucide-react';

interface CampaignSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onSelectCampaign: (campaignId: string) => void;
  onGoHome: () => void;
  onOpenCreateCampaign: () => void;
}

export const CampaignSwitcherModal: React.FC<CampaignSwitcherModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  activeCampaignId,
  onSelectCampaign,
  onGoHome,
  onOpenCreateCampaign
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="جابجایی بین کمپین‌ها">
      <div className="space-y-4 py-2 text-start" dir="rtl">
        {/* Go Home Button */}
        <Button
          onClick={() => {
            onGoHome();
            onClose();
          }}
          className="w-full p-3.5 rounded-2xl bg-accent/10 border border-accent/30 hover:bg-accent/20 text-accent-hover font-bold text-sm flex flex-wrap items-center justify-between gap-2 transition-colors min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent-hover">
              <Home className="w-4 h-4" />
            </div>
            <span>صفحه اصلی (داشبورد کمپین‌ها)</span>
          </div>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="border-t border-border pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
            <span className="text-xs font-bold text-text-muted">کمپین‌های من ({campaigns.length})</span>
            <Button
              onClick={() => {
                onClose();
                onOpenCreateCampaign();
              }}
              className="text-xs text-accent-hover font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              کمپین جدید
            </Button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {campaigns.map(camp => {
              const isActive = camp.id === activeCampaignId;
              return (
                <div
                  key={camp.id}
                  onClick={() => {
                    onSelectCampaign(camp.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-2 min-h-[48px] ${
                    isActive
                      ? 'bg-accent/20 border-accent/50 text-accent-hover'
                      : 'bg-bg/60 border-border hover:border-border-strong text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-accent text-on-accent font-bold' : 'bg-surface-2 text-text-muted'}`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{camp.name}</h4>
                      <p className="text-xs text-text-muted">
                        نقش: {camp.myRole === 'owner' ? 'مالک' : camp.myRole === 'co_dm' ? 'دستیار DM' : 'بازیکن'}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent text-on-accent">
                      فعال
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
