import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Check, X, MessageSquare, AlertCircle, Sparkles, User, ArrowUp } from 'lucide-react';

interface ApprovalItem {
  campaignId: string;
  campaignName: string;
  type: 'create' | 'level_up';
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

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`صف بررسی و تأیید دانجن مستر (${approvals.length})`}>
      <div className="space-y-4 py-2 text-right" dir="rtl">
        <p className="text-xs text-slate-400">
          درخواست‌های ورود شخصیت جدید و ارتقای سطح بازیکنان که نیازمند تأیید رسمی راوی هستند.
        </p>

        {approvals.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
            <Check className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-200">صف بررسی خالی است</h4>
            <p className="text-xs text-slate-500">هیچ درخواست تأیید نشده‌ای در کمپین‌های شما وجود ندارد.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {approvals.map((item, idx) => {
              const isSelected = activeItemId === item.participationId;
              const dateStr = new Date(item.requestedAt).toLocaleDateString('fa-IR');

              return (
                <div
                  key={item.participationId || idx}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.type === 'create'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.type === 'create' ? 'ورود شخصیت جدید' : 'ارتقای سطح (Level Up)'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">{item.characterName}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        بازیکن: {item.playerName} | کمپین: {item.campaignName} | سطح هدف: {item.level}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500">{dateStr}</span>
                  </div>

                  {item.details && (
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                      <span className="text-[10px] text-slate-500 block mb-1">تغییرات و مشخصات:</span>
                      {item.type === 'create' ? (
                        <span>کلاس پیشنهادی: {item.details.className || 'ماجراجو'}</span>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-300 font-semibold">
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>ارتقا به سطح {item.level}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isSelected ? (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="یادداشت یا دلیل رد / درخواست تغییرات برای بازیکن..."
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveItemId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleAction(item, 'reject')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold"
                        >
                          رد درخواست
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleAction(item, 'request_changes')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-bold"
                        >
                          درخواست اصلاح
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => setActiveItemId(item.participationId)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium flex items-center gap-1 min-h-[36px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>رد یا اصلاح...</span>
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handleAction(item, 'approve')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold flex items-center gap-1 min-h-[36px] shadow-md shadow-emerald-500/20"
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
