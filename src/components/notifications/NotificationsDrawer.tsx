import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { ScrollableRow } from '../ui/ScrollableRow';
import { NotificationItem, NotificationType } from '../../types';
import { groupNotificationsByCampaign, GroupedNotifications } from '../../../shared/rules/notifications';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Calendar,
  Swords,
  Scroll,
  User,
  Users,
  Award,
  MessageSquare,
  Vote,
  ExternalLink,
  Sparkles,
  Inbox,
  Loader2,
  Clock,
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCampaignId?: string | null;
  onNavigateToTarget?: (targetType?: string, targetId?: string, link?: string, campaignId?: string | null) => void;
  onOpenPreferences?: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  activeCampaignId,
  onNavigateToTarget,
  onOpenPreferences,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'current'>('all');
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, activeCampaignId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const items = await api.listNotifications();
      setNotifications(items);
      const unread = items.filter((n) => !n.readAt).length;
      onUnreadCountChange?.(unread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: Date.now(), isRead: true } : n))
      );
      const unread = notifications.filter((n) => n.id !== id && !n.readAt).length;
      onUnreadCountChange?.(unread);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || Date.now(), isRead: true }))
      );
      onUnreadCountChange?.(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const unread = notifications.filter((n) => n.id !== id && !n.readAt).length;
      onUnreadCountChange?.(unread);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.readAt) {
      handleMarkAsRead(item.id);
    }
    if (onNavigateToTarget) {
      onNavigateToTarget(
        item.payload.targetType,
        item.payload.targetId,
        item.payload.link,
        item.campaignId
      );
      onClose();
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'همین الان';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} دقیقه پیش`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} ساعت پیش`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} روز پیش`;
    return new Date(timestamp).toLocaleDateString('fa-IR');
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'session_scheduled':
      case 'session_changed':
      case 'session_cancelled':
      case 'rsvp_reminder':
        return <Calendar className="w-4 h-4 text-accent" />;
      case 'poll_opened':
      case 'poll_closed':
        return <Vote className="w-4 h-4 text-warning" />;
      case 'encounter_started':
        return <Swords className="w-4 h-4 text-danger" />;
      case 'quest_updated':
        return <Sparkles className="w-4 h-4 text-info" />;
      case 'handout_revealed':
        return <Scroll className="w-4 h-4 text-success" />;
      case 'approval_decided':
      case 'level_up_available':
        return <Award className="w-4 h-4 text-accent" />;
      case 'invite_received':
      case 'campaign_joined':
        return <Users className="w-4 h-4 text-info" />;
      case 'backstory_comment':
        return <MessageSquare className="w-4 h-4 text-role-codm" />;
      default:
        return <Bell className="w-4 h-4 text-accent" />;
    }
  };

  // Filter items
  let filteredItems = notifications;
  if (filterMode === 'unread') {
    filteredItems = notifications.filter((n) => !n.readAt);
  } else if (filterMode === 'current' && activeCampaignId) {
    filteredItems = notifications.filter((n) => n.campaignId === activeCampaignId);
  }

  const grouped = groupNotificationsByCampaign(filteredItems);
  const totalUnread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="اعلان‌ها و رویدادها">
        <div className="space-y-4 pb-6 text-sm text-text-primary" dir="rtl">
          {/* Top action bar: Filter Pills & Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-border pb-3">
            <ScrollableRow activeKey={filterMode} className="items-center gap-1.5 py-0.5">
              <Button
                type="button"
                data-scroll-key="all"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 snap-start transition-all min-h-[44px] ${
                  filterMode === 'all'
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'bg-surface-2 text-text-muted hover:text-text-primary'
                }`}
              >
                همه ({notifications.length})
              </Button>

              <Button
                type="button"
                data-scroll-key="unread"
                onClick={() => setFilterMode('unread')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 snap-start transition-all inline-flex items-center gap-1.5 min-h-[44px] ${
                  filterMode === 'unread'
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'bg-surface-2 text-text-muted hover:text-text-primary'
                }`}
              >
                <span className="whitespace-nowrap shrink-0">خوانده‌نشده</span>
                {totalUnread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-danger text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {totalUnread}
                  </span>
                )}
              </Button>

              {activeCampaignId && (
                <Button
                  type="button"
                  data-scroll-key="current"
                  onClick={() => setFilterMode('current')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 snap-start transition-all min-h-[44px] ${
                    filterMode === 'current'
                      ? 'bg-accent text-on-accent shadow-sm'
                      : 'bg-surface-2 text-text-muted hover:text-text-primary'
                  }`}
                >
                  کمپین فعلی
                </Button>
              )}
            </ScrollableRow>

            <div className="flex items-center gap-1.5 shrink-0">
              {totalUnread > 0 && (
                <Button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 text-accent text-xs font-medium flex items-center gap-1 border border-border-strong transition-colors"
                  title="خواندن همه اعلان‌ها"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">خواندن همه</span>
                </Button>
              )}

              <Button
                type="button"
                onClick={() => onOpenPreferences ? onOpenPreferences() : setPrefsModalOpen(true)}
                className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 text-text-muted hover:text-text-primary border border-border transition-colors"
                title="تنظیمات اعلان‌ها"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notification List / Grouped by Campaign */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
              <p className="text-xs">در حال بارگذاری اعلان‌ها...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-text-muted">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-disabled mb-1">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="font-semibold text-sm text-text-muted">هیچ اعلانی یافت نشد</p>
              <p className="text-xs max-w-xs">
                {filterMode === 'unread'
                  ? 'همه پیام‌ها را خوانده‌اید! صندوق ورودی شما پاکیزه است.'
                  : 'هنوز رویداد یا اعلانی ثبت نشده است.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-0.5">
              {grouped.map((group) => (
                <div key={group.campaignId || 'global'} className="space-y-2">
                  {/* Campaign Group Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-text-muted px-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {group.campaignTitle}
                    </span>
                    {group.unreadCount > 0 && (
                      <span className="text-xs font-normal text-accent">
                        {group.unreadCount} خوانده‌نشده
                      </span>
                    )}
                  </div>

                  {/* Items in Group */}
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const isUnread = !item.readAt;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all relative flex items-start gap-3 group ${
                            isUnread
                              ? 'bg-surface border-border-strong shadow-glow-amber'
                              : 'bg-bg border-border opacity-80 hover:opacity-100 hover:border-border'
                          }`}
                        >
                          {/* Type Icon Badge */}
                          <div
                            className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border ${
                              isUnread
                                ? 'bg-surface-2 border-accent'
                                : 'bg-surface border-border'
                            }`}
                          >
                            {getTypeIcon(item.type)}
                          </div>

                          {/* Content Body */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h5
                                onClick={() => handleItemClick(item)}
                                className={`font-bold text-xs sm:text-sm leading-snug cursor-pointer hover:text-accent-hover transition-colors ${
                                  isUnread ? 'text-text-primary' : 'text-text-muted'
                                }`}
                              >
                                {item.payload.title}
                              </h5>
                              <span className="text-xs text-text-muted shrink-0 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-text-disabled" />
                                {formatRelativeTime(item.createdAt)}
                              </span>
                            </div>

                            <p
                              onClick={() => handleItemClick(item)}
                              className="text-xs text-text-muted leading-relaxed cursor-pointer line-clamp-2"
                            >
                              {item.payload.body}
                            </p>

                            {/* Deep link action button & Delete */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                              <Button
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className="inline-flex items-center gap-1 text-accent hover:text-accent-hover font-semibold text-xs transition-colors py-0.5"
                              >
                                <span>مشاهده جزئیات</span>
                                <ExternalLink className="w-3 h-3" />
                              </Button>

                              <div className="flex items-center gap-2">
                                {isUnread && (
                                  <Button
                                    type="button"
                                    onClick={() => handleMarkAsRead(item.id)}
                                    className="text-xs text-text-muted hover:text-text-primary transition-colors"
                                  >
                                    علامت خوانده‌شده
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-text-disabled hover:text-danger transition-colors p-1"
                                  title="حذف این اعلان"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={prefsModalOpen}
        onClose={() => setPrefsModalOpen(false)}
        campaignId={activeCampaignId}
      />
    </>
  );
};
