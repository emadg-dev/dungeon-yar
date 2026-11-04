import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { NotificationPref, NotificationType } from '../../types';
import { NOTIFICATION_TYPE_DEFINITIONS, NotificationTypeMeta } from '../../../shared/rules/notifications';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import {
  Bell,
  BellOff,
  Smartphone,
  Shield,
  Check,
  Calendar,
  Swords,
  Scroll,
  User,
  Info,
  Loader2,
} from 'lucide-react';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string | null;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  campaignId,
}) => {
  const [prefs, setPrefs] = useState<NotificationPref | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPrefs();
      checkPushSupport();
    }
  }, [isOpen, campaignId]);

  const checkPushSupport = async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('unsupported');
      return;
    }
    setPushStatus(Notification.permission);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setPushSubscribed(!!sub);
      }
    } catch {
      setPushSubscribed(false);
    }
  };

  const loadPrefs = async () => {
    setLoading(true);
    try {
      const p = await api.getNotificationPreferences(campaignId || undefined);
      setPrefs(p);
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = async (type: NotificationType) => {
    if (!prefs) return;
    const currentEnabled = prefs.types[type] !== false; // default true
    const updatedTypes = {
      ...prefs.types,
      [type]: !currentEnabled,
    };

    setPrefs({ ...prefs, types: updatedTypes });
    setSaving(true);
    try {
      await api.updateNotificationPreferences(campaignId, { types: updatedTypes });
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePush = async () => {
    if (pushStatus === 'unsupported') return;
    setPushLoading(true);

    try {
      if (pushSubscribed) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await sub.unsubscribe();
            await api.unsubscribePush(sub.endpoint);
          }
        }
        setPushSubscribed(false);
        await api.updateNotificationPreferences(campaignId, { pushEnabled: false });
      } else {
        // Request permission & subscribe
        const permission = await Notification.requestPermission();
        setPushStatus(permission);

        if (permission === 'granted') {
          let reg = await navigator.serviceWorker.getRegistration();
          if (!reg) {
            reg = await navigator.serviceWorker.register('/sw.js');
          }

          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            // Note: In local/preview mode or standard VAPID mode
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckj0DCs2TeMMLZU6U7CG6GWcvpqfi8',
            });
          }

          if (sub) {
            const rawKey = sub.getKey('p256dh');
            const rawAuth = sub.getKey('auth');
            const p256dh = rawKey ? btoa(String.fromCharCode(...new Uint8Array(rawKey))) : '';
            const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth))) : '';

            await api.subscribePush({
              endpoint: sub.endpoint,
              keys: { p256dh, auth },
            });
            setPushSubscribed(true);
            await api.updateNotificationPreferences(campaignId, { pushEnabled: true });
          }
        }
      }
    } catch (err) {
      console.warn('Push subscription toggle error:', err);
    } finally {
      setPushLoading(false);
    }
  };

  const definitions = Object.values(NOTIFICATION_TYPE_DEFINITIONS);

  const categories: { key: NotificationTypeMeta['category']; title: string; icon: any }[] = [
    { key: 'session', title: 'جلسات و رویدادهای زنده', icon: Calendar },
    { key: 'campaign', title: 'کمپین و مأموریت‌ها', icon: Swords },
    { key: 'character', title: 'شخصیت و پیشینه داستانی', icon: User },
    { key: 'lore', title: 'اسناد و نقشه‌ها', icon: Scroll },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="تنظیمات اعلان‌ها و یادآوری‌ها">
      <div className="space-y-6 pb-6 text-sm text-text-primary" dir="rtl">
        {/* Web Push Notification Header & Status */}
        <div className="p-4 rounded-xl bg-surface border border-border shadow-inner space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-accent flex items-center justify-center text-accent">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">اعلان‌های مرورگر (Web Push)</h4>
                <p className="text-xs text-text-muted">دریافت پیام حتی در زمان بسته بودن برنامه</p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleTogglePush}
              disabled={pushLoading || pushStatus === 'unsupported'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                pushSubscribed
                  ? 'bg-success-bg text-success border border-success/40 hover:bg-success/20'
                  : 'bg-accent text-on-accent hover:bg-accent-hover font-bold shadow-md'
              } disabled:opacity-50`}
            >
              {pushLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pushSubscribed ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  فعال است
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  فعال‌سازی
                </>
              )}
            </Button>
          </div>

          {/* Honest Note for iOS Safari */}
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border-strong flex items-start gap-2 text-xs text-accent-hover">
            <Info className="w-4 h-4 shrink-0 text-accent mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-accent-hover">نکته مهم کاربران آیفون و آیپد (iOS): </span>
              در سیستم‌عامل iOS، دریافت اعلان‌های مرورگر تنها زمانی امکان‌پذیر است که برنامه را از طریق گزینه{' '}
              <span className="font-semibold text-white">Share &gt; Add to Home Screen</span> به عنوان وب‌اپلیکیشن (PWA) بر روی صفحه گوشی خود نصب کرده باشید.
            </div>
          </div>
        </div>

        {/* Per-type mute toggles grouped by category */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-muted">
              انواع اعلان‌ها و فیلتر بی‌صدا سازی
            </h4>
            {saving && <span className="text-xs text-accent">در حال ذخیره...</span>}
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
              <p className="text-xs">در حال بارگذاری تنظیمات...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const itemsInCat = definitions.filter((d) => d.category === cat.key);
                if (itemsInCat.length === 0) return null;
                const Icon = cat.icon;

                return (
                  <div key={cat.key} className="rounded-xl border border-border bg-surface overflow-hidden">
                    <div className="px-3.5 py-2.5 bg-surface-2 border-b border-border flex items-center gap-2 text-xs font-bold text-text-primary">
                      <Icon className="w-4 h-4 text-accent" />
                      <span>{cat.title}</span>
                    </div>

                    <div className="divide-y divide-surface-2">
                      {itemsInCat.map((item) => {
                        const isEnabled = prefs?.types[item.type] !== false; // default true

                        return (
                          <div
                            key={item.type}
                            className="p-3 flex flex-wrap items-center justify-between gap-2 gap-3 hover:bg-surface transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-text-primary text-xs sm:text-sm">{item.labelFa}</div>
                              <p className="text-xs text-text-muted line-clamp-1">{item.descriptionFa}</p>
                            </div>

                            <Button
                              type="button"
                              onClick={() => toggleType(item.type)}
                              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                                isEnabled ? 'bg-accent' : 'bg-surface-2'
                              }`}
                              title={isEnabled ? 'فعال (کلیک برای غیرفعال‌سازی)' : 'غیرفعال (کلیک برای فعال‌سازی)'}
                            >
                              <span
                                className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                                  isEnabled ? 'translate-x-0' : '-translate-x-6'
                                }`}
                              />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-primary font-medium border border-border-strong transition-colors"
          >
            بستن و بازگشت
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
