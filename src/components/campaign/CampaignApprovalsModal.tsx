import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Check, X, MessageSquare, AlertCircle, Sparkles, User, ArrowUp, Shield, Dumbbell } from 'lucide-react';

export interface ApprovalItem {
  campaignId: string;
  campaignName: string;
  type: 'create' | 'level_up' | 'sheet_change';
  participationId: string;
  characterId: string;
  characterName: string;
  playerName: string;
  level: number;
  requestedAt: number;
  details?: any;
}

interface CampaignApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvals: ApprovalItem[];
  onReview: (
    campaignId: string,
    participationId: string,
    action: 'approve' | 'reject' | 'request_changes',
    comment?: string
  ) => Promise<void>;
}

export const CampaignApprovalsModal: React.FC<CampaignApprovalsModalProps> = ({
  isOpen,
  onClose,
  approvals,
  onReview
}) => {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (item: ApprovalItem, action: 'approve' | 'reject' | 'request_changes') => {
    setLoading(true);
    try {
      await onReview(item.campaignId, item.participationId, action, comment.trim());
      setComment('');
      setActiveItemId(null);
    } finally {
      setLoading(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    abilityScores: 'امتیازات ویژگی‌های بنیادین',
    subclassName: 'زیرکلاس اختصاصی',
    className: 'کلاس اصلی',
    maxHp: 'حداکثر جان (HP)',
    hitDice: 'تاس‌های جان',
    features: 'قابلیت‌های ویژه'
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`صف بررسی و تأیید دانجن مستر (${approvals.length})`}>
      <div className="space-y-4 py-2 text-right" dir="rtl">
        <p className="text-xs text-[#A39A89]">
          درخواست‌های ورود شخصیت جدید، ارتقای سطح (Level-Up) و تغییرات برگه کاراکتر که نیازمند تأیید رسمی راوی هستند.
        </p>

        {approvals.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[#2F2A23] text-center space-y-2">
            <Check className="w-8 h-8 text-[#6F9E78] mx-auto" />
            <h4 className="text-sm font-bold text-[#EDE6D8]">صف بررسی خالی است</h4>
            <p className="text-xs text-[#8A8374]">هیچ درخواست تأیید نشده‌ای در کمپین‌های شما وجود ندارد.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
            {approvals.map((item, idx) => {
              const isSelected = activeItemId === item.participationId;
              const dateStr = new Date(item.requestedAt).toLocaleDateString('fa-IR');
              const diff = item.details?.diff;

              return (
                <div
                  key={item.participationId || idx}
                  className="p-4 rounded-2xl bg-[#131110]/90 border border-[#2F2A23] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.type === 'create'
                            ? 'bg-[#7FB4D6]/20 text-[#7FB4D6] border border-[#7FB4D6]/30'
                            : item.type === 'level_up'
                            ? 'bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30'
                            : 'bg-[#C97B4A]/20 text-[#F2C265] border border-[#C97B4A]/30'
                        }`}>
                          {item.type === 'create' 
                            ? 'ورود شخصیت جدید' 
                            : item.type === 'level_up' 
                            ? 'ارتقای سطح (Level Up)' 
                            : 'درخواست تغییر برگه'}
                        </span>
                        <h4 className="text-sm font-bold text-[#EDE6D8]">{item.characterName}</h4>
                      </div>
                      <p className="text-xs text-[#A39A89] mt-1">
                        بازیکن: {item.playerName} | کمپین: {item.campaignName} {item.level ? `| سطح: ${item.level}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#8A8374]">{dateStr}</span>
                  </div>

                  {/* Level-Up Detailed Diff */}
                  {item.type === 'level_up' && (
                    <div className="p-3 rounded-xl bg-[#0E0D0C]/80 border border-[#2F2A23] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#F2C265] font-bold">
                        <span className="flex items-center gap-1.5">
                          <ArrowUp className="w-3.5 h-3.5" />
                          ارتقا به سطح {item.level}
                        </span>
                        {diff?.hp && (
                          <span className="text-[#6F9E78] font-mono">
                            جان: {diff.hp.before} → {diff.hp.after} (+{diff.hp.gain})
                          </span>
                        )}
                      </div>

                      {diff?.abilityScores && Object.keys(diff.abilityScores).length > 0 && (
                        <div className="pt-1.5 border-t border-[#2F2A23]/60 space-y-1">
                          <span className="text-[10px] text-[#A39A89] block font-bold flex items-center gap-1">
                            <Dumbbell className="w-3 h-3 text-[#E0A030]" />
                            بهبود ویژگی‌ها (ASI):
                          </span>
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {Object.entries(diff.abilityScores).map(([stat, val]: any) => (
                              <span key={stat} className="px-2 py-0.5 rounded bg-[#1f1b18] border border-[#2F2A23] text-[#EDE6D8]">
                                {stat.toUpperCase()}: <strong className="text-[#F2C265]">{val.before} → {val.after}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {diff?.subclass && (
                        <div className="text-[11px] text-[#F2C265] pt-1">
                          زیرکلاس انتخابی: <strong>{diff.subclass.after}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sheet Change Request Details */}
                  {item.type === 'sheet_change' && (
                    <div className="p-3 rounded-xl bg-[#0E0D0C]/80 border border-[#2F2A23] space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[#E0A030] font-bold">
                        <Shield className="w-3.5 h-3.5" />
                        <span>بخش درخواستی: {fieldLabels[item.details?.field] || item.details?.field}</span>
                      </div>
                      <div className="text-[#EDE6D8] bg-[#1a1714] p-2 rounded-lg border border-[#2F2A23]">
                        <span className="text-[10px] text-[#A39A89] block mb-0.5">تغییر پیشنهادی:</span>
                        <span className="font-semibold">{item.details?.proposedValue}</span>
                      </div>
                      {item.details?.reason && (
                        <div className="text-[#A39A89] text-[11px] leading-relaxed">
                          <strong className="text-[#EDE6D8]">دلیل بازیکن: </strong>
                          {item.details.reason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Character Creation Details */}
                  {item.type === 'create' && item.details && (
                    <div className="p-2.5 rounded-xl bg-[#0E0D0C]/60 border border-[#2F2A23]/80 text-xs text-[#C9C0AE]">
                      <span className="text-[10px] text-[#8A8374] block mb-1">مشخصات شخصیت:</span>
                      <span>کلاس پیشنهادی: {item.details.className || 'ماجراجو'}</span>
                    </div>
                  )}

                  {isSelected ? (
                    <div className="pt-2 border-t border-[#2F2A23] space-y-2">
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="یادداشت یا دلیل رد / درخواست تغییرات برای بازیکن..."
                        rows={2}
                        className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl p-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveItemId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs text-[#A39A89] hover:text-[#EDE6D8]"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleAction(item, 'reject')}
                          className="px-3 py-1.5 rounded-xl bg-[#C2512B]/20 text-[#E8836B] border border-[#C2512B]/30 hover:bg-[#C2512B]/30 text-xs font-bold"
                        >
                          رد درخواست
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleAction(item, 'request_changes')}
                          className="px-3 py-1.5 rounded-xl bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30 hover:bg-[#E0A030]/30 text-xs font-bold"
                        >
                          درخواست اصلاح
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2F2A23]/60">
                      <button
                        onClick={() => setActiveItemId(item.participationId)}
                        className="px-3 py-1.5 rounded-xl bg-[#201D19] text-[#C9C0AE] hover:text-[#EDE6D8] text-xs font-medium flex items-center gap-1 min-h-[36px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>رد یا اصلاح...</span>
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handleAction(item, 'approve')}
                        className="px-4 py-1.5 rounded-xl bg-[#6F9E78] text-[#0E0D0C] hover:bg-[#6F9E78] text-xs font-bold flex items-center gap-1 min-h-[36px] shadow-md shadow-[#6F9E78]/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تأیید رسمی</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
