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
      <div className="space-y-4 py-2 text-right" dir="rtl">
        {/* Go Home Button */}
        <button
          onClick={() => {
            onGoHome();
            onClose();
          }}
          className="w-full p-3.5 rounded-2xl bg-[#E0A030]/10 border border-[#E0A030]/30 hover:bg-[#E0A030]/20 text-[#F2C265] font-bold text-sm flex items-center justify-between transition-colors min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E0A030]/20 flex items-center justify-center text-[#F2C265]">
              <Home className="w-4 h-4" />
            </div>
            <span>صفحه اصلی (داشبورد کمپین‌ها)</span>
          </div>
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="border-t border-[#2F2A23] pt-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-[#A39A89]">کمپین‌های من ({campaigns.length})</span>
            <button
              onClick={() => {
                onClose();
                onOpenCreateCampaign();
              }}
              className="text-xs text-[#F2C265] font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              کمپین جدید
            </button>
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
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[48px] ${
                    isActive
                      ? 'bg-[#E0A030]/20 border-[#E0A030]/50 text-[#F2C265]'
                      : 'bg-[#131110]/60 border-[#2F2A23] hover:border-[#3A342B] text-[#C9C0AE]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-[#E0A030] text-[#0E0D0C] font-bold' : 'bg-[#201D19] text-[#A39A89]'}`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{camp.name}</h4>
                      <p className="text-[11px] text-[#A39A89]">
                        نقش: {camp.myRole === 'owner' ? 'مالک' : camp.myRole === 'co_dm' ? 'دستیار DM' : 'بازیکن'}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E0A030] text-[#0E0D0C]">
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
