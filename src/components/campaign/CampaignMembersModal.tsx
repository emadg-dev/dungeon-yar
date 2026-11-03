import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Campaign, CampaignMember, CampaignRole, User } from '../../types';
import { Users, Crown, Shield, UserX, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { canChangeMemberRole, canKickMember, getRoleLabelFa } from '../../../shared/permissions';

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

  const actorMember = members.find(m => m.userId === currentUser?.id);
  const actorRole: CampaignRole = (actorMember?.role as CampaignRole) || (campaign.ownerId === currentUser?.id ? 'owner' : 'spectator');
  const isOwner = actorRole === 'owner';

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
      <div className="space-y-4 py-2 text-start" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs">
            {errorMsg}
          </div>
        )}

        {/* Transfer Ownership Confirmation Section */}
        {transferTargetId && (
          <div className="p-4 rounded-2xl bg-accent/15 border border-accent/40 space-y-3">
            <div className="flex items-center gap-2 text-accent-hover text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-accent-hover" />
              <span>هشدار انتقال مالکیت کمپین</span>
            </div>
            <p className="text-xs text-text-primary leading-relaxed">
              آیا مطمئن هستید که می‌خواهید مالکیت این کمپین را واگذار کنید؟ پس از این کار، نقش شما به دستیار دانجن مستر تغییر یافته و کاربر جدید مالک کامل کمپین خواهد بود.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferTargetId(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-text-muted hover:text-text-primary"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-accent text-on-accent font-bold text-xs hover:bg-accent-hover"
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
            const validRoles: CampaignRole[] = ['co_dm', 'player', 'spectator'];
            const allowedNextRoles = validRoles.filter(
              r => r !== member.role && canChangeMemberRole(actorRole, member.role as CampaignRole, r)
            );
            const canKick = !isSelf && canKickMember(actorRole, member.role as CampaignRole);
            const canTransfer = isOwner && !isMemberOwner && !isSelf;

            const badgeColorClass =
              member.role === 'owner'
                ? 'bg-accent/20 text-accent-hover border border-accent/40'
                : member.role === 'co_dm'
                ? 'bg-role-codm/20 text-role-codm border border-role-codm/40'
                : member.role === 'player'
                ? 'bg-info/30 text-info border border-info/40'
                : 'bg-text-disabled/30 text-text-muted border border-text-disabled/40';

            return (
              <div
                key={member.userId}
                className="p-3.5 rounded-2xl bg-bg/80 border border-border flex items-center justify-between gap-3 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isMemberOwner ? 'bg-accent/20 text-accent-hover' : 'bg-surface-2 text-text-muted'
                  }`}>
                    {isMemberOwner ? <Crown className="w-5 h-5" /> : <Shield className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary">{member.userName || 'کاربر'}</h4>
                      {isSelf && <span className="text-xs text-accent-hover font-semibold">(شما)</span>}
                    </div>
                    <p className="text-xs text-text-muted">
                      {member.characterName ? `شخصیت: ${member.characterName}` : member.userEmail || ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role Selector (If actor has rights to change this member's role) */}
                  {allowedNextRoles.length > 0 ? (
                    <select
                      value={member.role}
                      onChange={e => onUpdateMemberRole(member.userId, e.target.value as CampaignRole)}
                      className="bg-bg border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-primary font-medium"
                    >
                      <option value={member.role}>{getRoleLabelFa(member.role as CampaignRole)}</option>
                      {allowedNextRoles.map(r => (
                        <option key={r} value={r}>
                          {getRoleLabelFa(r)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-xl font-bold ${badgeColorClass}`}>
                      {getRoleLabelFa(member.role as CampaignRole)}
                    </span>
                  )}

                  {/* Actions for owner / co-dm */}
                  <div className="flex items-center gap-1">
                    {canTransfer && (
                      <button
                        title="انتقال مالکیت به این کاربر"
                        onClick={() => setTransferTargetId(member.userId)}
                        className="p-2 rounded-xl text-accent-hover hover:bg-accent/10 transition-colors"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    )}
                    {canKick && (
                      <button
                        title="حذف از کمپین"
                        onClick={() => onRemoveMember(member.userId)}
                        className="p-2 rounded-xl text-danger-hover hover:bg-danger/10 transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};
