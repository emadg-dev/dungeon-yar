import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { NotificationItem, NotificationType } from '../../types';
import { groupNotificationsByCampaign, GroupedNotifications } from '../../../shared/rules/notifications';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { api } from '../../services/api';
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
        return <Calendar className="w-4 h-4 text-[#E0A030]" />;
      case 'poll_opened':
      case 'poll_closed':
        return <Vote className="w-4 h-4 text-[#D89427]" />;
      case 'encounter_started':
        return <Swords className="w-4 h-4 text-[#DC4437]" />;
      case 'quest_updated':
        return <Sparkles className="w-4 h-4 text-[#4285F4]" />;
      case 'handout_revealed':
        return <Scroll className="w-4 h-4 text-[#34A853]" />;
      case 'approval_decided':
      case 'level_up_available':
        return <Award className="w-4 h-4 text-[#F4B400]" />;
      case 'invite_received':
      case 'campaign_joined':
        return <Users className="w-4 h-4 text-[#00ACC1]" />;
      case 'backstory_comment':
        return <MessageSquare className="w-4 h-4 text-[#AB47BC]" />;
      default:
        return <Bell className="w-4 h-4 text-[#E0A030]" />;
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
        <div className="space-y-4 pb-6 text-sm text-[#E2D8C3]" dir="rtl">
          {/* Top action bar: Filter Pills & Action buttons */}
          <div className="flex items-center justify-between gap-2 border-b border-[#2F2A23] pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#E0A030] text-[#0E0D0C] shadow-sm'
                    : 'bg-[#1F1C18] text-[#9E9080] hover:text-[#E2D8C3]'
                }`}
              >
                همه ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  filterMode === 'unread'
                    ? 'bg-[#E0A030] text-[#0E0D0C] shadow-sm'
                    : 'bg-[#1F1C18] text-[#9E9080] hover:text-[#E2D8C3]'
                }`}
              >
                <span>خوانده‌نشده</span>
                {totalUnread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#DC4437] text-white text-[10px] flex items-center justify-center font-bold">
                    {totalUnread}
                  </span>
                )}
              </button>

              {activeCampaignId && (
                <button
                  type="button"
                  onClick={() => setFilterMode('current')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filterMode === 'current'
                      ? 'bg-[#E0A030] text-[#0E0D0C] shadow-sm'
                      : 'bg-[#1F1C18] text-[#9E9080] hover:text-[#E2D8C3]'
                  }`}
                >
                  کمپین فعلی
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {totalUnread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg bg-[#1F1C18] hover:bg-[#2A2620] text-[#E0A030] text-xs font-medium flex items-center gap-1 border border-[#3E352B] transition-colors"
                  title="خواندن همه اعلان‌ها"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">خواندن همه</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenPreferences ? onOpenPreferences() : setPrefsModalOpen(true)}
                className="p-1.5 rounded-lg bg-[#1F1C18] hover:bg-[#2A2620] text-[#9E9080] hover:text-[#E2D8C3] border border-[#2F2A23] transition-colors"
                title="تنظیمات اعلان‌ها"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List / Grouped by Campaign */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#9E9080]">
              <Loader2 className="w-6 h-6 animate-spin text-[#E0A030]" />
              <p className="text-xs">در حال بارگذاری اعلان‌ها...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-[#9E9080]">
              <div className="w-12 h-12 rounded-full bg-[#1F1C18] border border-[#2F2A23] flex items-center justify-center text-[#554C40] mb-1">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="font-semibold text-sm text-[#C8BCAB]">هیچ اعلانی یافت نشد</p>
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
                  <div className="flex items-center justify-between text-xs font-bold text-[#A89885] px-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E0A030]" />
                      {group.campaignTitle}
                    </span>
                    {group.unreadCount > 0 && (
                      <span className="text-[11px] font-normal text-[#E0A030]">
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
                              ? 'bg-[#1C1813] border-[#705224] shadow-[0_0_10px_rgba(224,160,48,0.08)]'
                              : 'bg-[#141210] border-[#26221C] opacity-80 hover:opacity-100 hover:border-[#383127]'
                          }`}
                        >
                          {/* Type Icon Badge */}
                          <div
                            className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border ${
                              isUnread
                                ? 'bg-[#272118] border-[#8A6329]'
                                : 'bg-[#1A1815] border-[#2B2620]'
                            }`}
                          >
                            {getTypeIcon(item.type)}
                          </div>

                          {/* Content Body */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h5
                                onClick={() => handleItemClick(item)}
                                className={`font-bold text-xs sm:text-sm leading-snug cursor-pointer hover:text-[#F2C265] transition-colors ${
                                  isUnread ? 'text-[#FBF7EE]' : 'text-[#C9BDAB]'
                                }`}
                              >
                                {item.payload.title}
                              </h5>
                              <span className="text-[10px] text-[#8C8070] shrink-0 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-[#6A6054]" />
                                {formatRelativeTime(item.createdAt)}
                              </span>
                            </div>

                            <p
                              onClick={() => handleItemClick(item)}
                              className="text-xs text-[#A89885] leading-relaxed cursor-pointer line-clamp-2"
                            >
                              {item.payload.body}
                            </p>

                            {/* Deep link action button & Delete */}
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <button
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className="inline-flex items-center gap-1 text-[#E0A030] hover:text-[#F2C265] font-semibold text-[11px] transition-colors py-0.5"
                              >
                                <span>مشاهده جزئیات</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>

                              <div className="flex items-center gap-2">
                                {isUnread && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAsRead(item.id)}
                                    className="text-[11px] text-[#9E9080] hover:text-[#E2D8C3] transition-colors"
                                  >
                                    علامت خوانده‌شده
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-[#6D6357] hover:text-[#DC4437] transition-colors p-1"
                                  title="حذف این اعلان"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
