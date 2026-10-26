import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Campaign, CampaignMember, CampaignRole, User } from '../../types';
import { Users, Crown, Shield, UserX, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface CampaignMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  currentUser: User | null;
  members: CampaignMember[];
  onUpdateMemberRole: (userId: string, newRole: CampaignRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onTransferOwnership: (newOwnerId: string) => Promise<void>;
}

export const CampaignMembersModal: React.FC<CampaignMembersModalProps> = ({
  isOpen,
  onClose,
  campaign,
  currentUser,
  members,
  onUpdateMemberRole,
  onRemoveMember,
  onTransferOwnership
}) => {
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner = campaign.ownerId === currentUser?.id;

  const handleTransfer = async () => {
    if (!transferTargetId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await onTransferOwnership(transferTargetId);
      setTransferTargetId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در انتقال مالکیت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`اعضای کمپین (${members.length})`}>
      <div className="space-y-4 py-2 text-right" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Transfer Ownership Confirmation Section */}
        {transferTargetId && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>هشدار انتقال مالکیت کمپین</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              آیا مطمئن هستید که می‌خواهید مالکیت این کمپین را واگذار کنید؟ پس از این کار، نقش شما به دستیار دانجن مستر تغییر یافته و کاربر جدید مالک کامل کمپین خواهد بود.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferTargetId(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
              >
                تأیید و انتقال مالکیت
              </button>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {members.map(member => {
            const isMemberOwner = member.role === 'owner';
            const isSelf = member.userId === currentUser?.id;

            return (
              <div
                key={member.userId}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isMemberOwner ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isMemberOwner ? <Crown className="w-5 h-5" /> : <Shield className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-200">{member.userName || 'کاربر'}</h4>
                      {isSelf && <span className="text-[10px] text-amber-400 font-semibold">(شما)</span>}
                    </div>
                    <p className="text-xs text-slate-400">
                      {member.characterName ? `شخصیت: ${member.characterName}` : member.userEmail || ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role Selector (Only DM can change, and Owner cannot be demoted directly) */}
                  {isOwner && !isMemberOwner ? (
                    <select
                      value={member.role}
                      onChange={e => onUpdateMemberRole(member.userId, e.target.value as CampaignRole)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-medium"
                    >
                      <option value="co_dm">دستیار DM</option>
                      <option value="player">بازیکن</option>
                      <option value="spectator">تماشاچی</option>
                    </select>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300">
                      {member.role === 'owner' ? '👑 مالک کمپین' : member.role === 'co_dm' ? 'دستیار DM' : member.role === 'spectator' ? 'تماشاچی' : 'بازیکن'}
                    </span>
                  )}

                  {/* Actions for owner */}
                  {isOwner && !isMemberOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        title="انتقال مالکیت به این کاربر"
                        onClick={() => setTransferTargetId(member.userId)}
                        className="p-2 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button
                        title="حذف از کمپین"
                        onClick={() => onRemoveMember(member.userId)}
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};
