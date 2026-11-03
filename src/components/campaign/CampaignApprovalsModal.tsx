import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Check, X, MessageSquare, AlertCircle, Sparkles, User, ArrowUp, Shield, Dumbbell } from 'lucide-react';

export interface ApprovalItem {
  campaignId: string;
  campaignName: string;
  type: 'create' | 'level_up' | 'sheet_change' | 'backstory_review';
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
      <div className="space-y-4 py-2 text-start" dir="rtl">
        <p className="text-xs text-text-muted">
          درخواست‌های ورود شخصیت جدید، ارتقای سطح (Level-Up) و تغییرات برگه کاراکتر که نیازمند تأیید رسمی راوی هستند.
        </p>

        {approvals.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center space-y-2">
            <Check className="w-8 h-8 text-success mx-auto" />
            <h4 className="text-sm font-bold text-text-primary">صف بررسی خالی است</h4>
            <p className="text-xs text-text-muted">هیچ درخواست تأیید نشده‌ای در کمپین‌های شما وجود ندارد.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
            {approvals.map((item, idx) => {
              const isSelected = activeItemId === item.participationId;
              const dateStr = new Date(item.requestedAt).toLocaleDateString('fa-IR-u-nu-latn');
              const diff = item.details?.diff;

              return (
                <div
                  key={item.participationId || idx}
                  className="p-4 rounded-2xl bg-bg/90 border border-border space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          item.type === 'create'
                            ? 'bg-info/20 text-info border border-info/30'
                            : item.type === 'level_up'
                            ? 'bg-accent/20 text-accent-hover border border-accent/30'
                            : item.type === 'sheet_change'
                            ? 'bg-warning/20 text-accent-hover border border-warning/30'
                            : 'bg-role-codm/20 text-info border border-role-codm/30'
                        }`}>
                          {item.type === 'create' 
                            ? 'ورود شخصیت جدید' 
                            : item.type === 'level_up' 
                            ? 'ارتقای سطح (Level Up)' 
                            : item.type === 'sheet_change'
                            ? 'درخواست تغییر برگه'
                            : 'بازبینی پیشینه داستانی'}
                        </span>
                        <h4 className="text-sm font-bold text-text-primary">{item.characterName}</h4>
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        بازیکن: {item.playerName} | کمپین: {item.campaignName} {item.level ? `| سطح: ${item.level}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-text-muted">{dateStr}</span>
                  </div>

                  {/* Backstory Review Details */}
                  {item.type === 'backstory_review' && item.details?.backstory && (
                    <div className="p-3 rounded-xl bg-bg/80 border border-border space-y-1.5 text-xs">
                      <div className="text-accent-hover font-bold">خلاصه پیشینه ارسالی:</div>
                      <p className="text-text-primary leading-relaxed line-clamp-3">
                        {item.details.backstory.summary || item.details.backstory.origin || 'پیشینه تدوین شده و آماده بازبینی است.'}
                      </p>
                    </div>
                  )}

                  {/* Level-Up Detailed Diff */}
                  {item.type === 'level_up' && (
                    <div className="p-3 rounded-xl bg-bg/80 border border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between text-accent-hover font-bold">
                        <span className="flex items-center gap-1.5">
                          <ArrowUp className="w-3.5 h-3.5" />
                          ارتقا به سطح {item.level}
                        </span>
                        {diff?.hp && (
                          <span className="text-success font-mono">
                            جان: {diff.hp.before} → {diff.hp.after} (+{diff.hp.gain})
                          </span>
                        )}
                      </div>

                      {diff?.abilityScores && Object.keys(diff.abilityScores).length > 0 && (
                        <div className="pt-1.5 border-t border-border/60 space-y-1">
                          <span className="text-xs text-text-muted block font-bold flex items-center gap-1">
                            <Dumbbell className="w-3 h-3 text-accent" />
                            بهبود ویژگی‌ها (ASI):
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {Object.entries(diff.abilityScores).map(([stat, val]: any) => (
                              <span key={stat} className="px-2 py-0.5 rounded bg-surface-2 border border-border text-text-primary">
                                {stat.toUpperCase()}: <strong className="text-accent-hover">{val.before} → {val.after}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {diff?.subclass && (
                        <div className="text-xs text-accent-hover pt-1">
                          زیرکلاس انتخابی: <strong>{diff.subclass.after}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sheet Change Request Details */}
                  {item.type === 'sheet_change' && (
                    <div className="p-3 rounded-xl bg-bg/80 border border-border space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-accent font-bold">
                        <Shield className="w-3.5 h-3.5" />
                        <span>بخش درخواستی: {fieldLabels[item.details?.field] || item.details?.field}</span>
                      </div>
                      <div className="text-text-primary bg-surface p-2 rounded-lg border border-border">
                        <span className="text-xs text-text-muted block mb-0.5">تغییر پیشنهادی:</span>
                        <span className="font-semibold">{item.details?.proposedValue}</span>
                      </div>
                      {item.details?.reason && (
                        <div className="text-text-muted text-xs leading-relaxed">
                          <strong className="text-text-primary">دلیل بازیکن: </strong>
                          {item.details.reason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Character Creation Details */}
                  {item.type === 'create' && item.details && (
                    <div className="p-2.5 rounded-xl bg-bg/60 border border-border/80 text-xs text-text-primary">
                      <span className="text-xs text-text-muted block mb-1">مشخصات شخصیت:</span>
                      <span>کلاس پیشنهادی: {item.details.className || 'ماجراجو'}</span>
                    </div>
                  )}

                  {isSelected ? (
                    <div className="pt-2 border-t border-border space-y-2">
                      <Textarea noWrapper
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="یادداشت یا دلیل رد / درخواست تغییرات برای بازیکن..."
                        rows={2}
                        className="w-full bg-bg border border-border rounded-xl p-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          onClick={() => setActiveItemId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs text-text-muted hover:text-text-primary"
                        >
                          انصراف
                        </Button>
                        <Button
                          type="button"
                          disabled={loading}
                          onClick={() => handleAction(item, 'reject')}
                          className="px-3 py-1.5 rounded-xl bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30 text-xs font-bold"
                        >
                          رد درخواست
                        </Button>
                        <Button
                          type="button"
                          disabled={loading}
                          onClick={() => handleAction(item, 'request_changes')}
                          className="px-3 py-1.5 rounded-xl bg-accent/20 text-accent-hover border border-accent/30 hover:bg-accent/30 text-xs font-bold"
                        >
                          درخواست اصلاح
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                      <Button
                        onClick={() => setActiveItemId(item.participationId)}
                        className="px-3 py-1.5 rounded-xl bg-surface-2 text-text-primary hover:text-text-primary text-xs font-medium flex items-center gap-1 min-h-[36px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>رد یا اصلاح...</span>
                      </Button>
                      <Button
                        disabled={loading}
                        onClick={() => handleAction(item, 'approve')}
                        className="px-4 py-1.5 rounded-xl bg-success text-on-accent hover:bg-success text-xs font-bold flex items-center gap-1 min-h-[36px] shadow-md shadow-success/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تأیید رسمی</span>
                      </Button>
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
