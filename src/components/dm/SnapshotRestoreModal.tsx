import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { RotateCcw, Clock, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface SnapshotItem {
  id: string;
  participation_id: string;
  label: string;
  state: any;
  build: any;
  level: number;
  created_by: string;
  created_at: string;
}

interface SnapshotRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  participationId: string;
  characterName: string;
  onSnapshotRestored: () => void;
}

export const SnapshotRestoreModal: React.FC<SnapshotRestoreModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  participationId,
  characterName,
  onSnapshotRestored
}) => {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && campaignId && participationId) {
      loadSnapshots();
    }
  }, [isOpen, campaignId, participationId]);

  const loadSnapshots = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listParticipationSnapshots(campaignId, participationId);
      setSnapshots((list as any) || []);
    } catch (e: any) {
      setError('خطا در بارگذاری تاریخچه اسنپ‌شات‌ها.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (snapId: string) => {
    setRestoringId(snapId);
    setError(null);
    try {
      await api.restoreParticipationSnapshot(campaignId, participationId, snapId);
      onSnapshotRestored();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'خطا در بازگردانی وضعیت اسنپ‌شات.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="بازگردانی وضعیت و اسنپ‌شات"
      subtitle={`شخصیت: ${characterName} (10 وضعیت اخیر)`}
    >
      <div className="space-y-4 py-2 text-start" dir="rtl">
        <p className="text-xs text-text-muted">
          دانجن‌یار به‌طور خودکار هنگام هر ارتقای سطح، پذیرش یا بازسازی، یک اسنپ‌شات امنیتی ثبت می‌کند (تا 10 نسخه اخیر).
        </p>

        {loading ? (
          <div className="py-8 text-center text-xs text-text-muted animate-pulse">
            در حال بارگذاری اسنپ‌شات‌ها...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center space-y-2">
            <Clock className="w-8 h-8 text-text-muted mx-auto" />
            <h4 className="text-sm font-bold text-text-primary">هیچ اسنپ‌شاتی ثبت نشده است</h4>
            <p className="text-xs text-text-muted">با اولین ارتقای سطح یا تغییر رسمی، اسنپ‌شات خودکار ذخیره می‌شود.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
            {snapshots.map(snap => {
              const dateStr = new Date(snap.created_at).toLocaleDateString('fa-IR-u-nu-latn');
              const isRestoring = restoringId === snap.id;

              return (
                <div
                  key={snap.id}
                  className="p-3 rounded-xl bg-bg border border-border flex flex-wrap items-center justify-between gap-2 gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-text-primary truncate">{snap.label}</span>
                      <span className="px-1.5 py-0.2 rounded bg-accent/15 text-accent text-xs font-bold">
                        سطح {snap.level}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      ثبت شده در: {dateStr}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={() => handleRestore(snap.id)}
                    className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-accent text-xs font-bold text-accent-hover transition flex items-center gap-1.5 shrink-0 min-h-[44px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRestoring ? 'در حال بازگردانی...' : 'بازگردانی این وضعیت'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-xl bg-danger/20 border border-danger text-xs text-danger flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
