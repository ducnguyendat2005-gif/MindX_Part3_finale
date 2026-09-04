import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Copy, Gift, MessageCircle, UserPlus, X } from 'lucide-react';
import { API, fetchWithAuth } from '../../config/api.js';
import styles from './Header.module.scss';

const FRIEND_STATUS_EVENT = 'friendStatusUpdated';

const formatDate = (date) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsedDate);
};

export default function NotificationPanel({ user, isOpen, onOpenMessage, onUnreadCountChange }) {
  const [friendRequests, setFriendRequests] = useState([]);
  const [messageNotifications, setMessageNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingRequestId, setActingRequestId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [dismissedKeys, setDismissedKeys] = useState(() => new Set());

  const dismissNotification = (event, notification) => {
    event.stopPropagation();
    const key = notification.notificationType + '-' + notification.id;
    setDismissedKeys((current) => new Set(current).add(key));
  };

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setFriendRequests([]);
      setMessageNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const [friendRes, messageRes] = await Promise.all([
        fetchWithAuth(API.friendRequests),
        fetchWithAuth(API.messageNotifications),
      ]);
      const friendResult = await friendRes.json().catch(() => ({}));
      const messageResult = await messageRes.json().catch(() => ({}));
      if (!friendRes.ok) throw new Error(friendResult.message || 'Không thể tải lời mời kết bạn');
      if (!messageRes.ok) throw new Error(messageResult.message || 'Không thể tải thông báo tin nhắn');

      setFriendRequests(friendResult.data || []);
      // messageResult.data giờ đã gồm cả message/welcome/event_reward (BE gộp sẵn)
      setMessageNotifications(messageResult.data || []);
    } catch (error) {
      console.error('Could not load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    window.addEventListener(FRIEND_STATUS_EVENT, loadNotifications);
    const intervalId = window.setInterval(loadNotifications, 15000);

    return () => {
      window.removeEventListener(FRIEND_STATUS_EVENT, loadNotifications);
      window.clearInterval(intervalId);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [isOpen, loadNotifications]);

  // type từ BE: 'message' | 'welcome' | 'event_reward' → map ra notificationType để render
  const mapNotificationType = (type) => {
    if (type === 'welcome') return 'welcome';
    if (type === 'event_reward') return 'reward';
    return 'message';
  };

  const notifications = useMemo(() => [
    ...friendRequests.map((request) => ({ ...request, notificationType: 'friend' })),
    ...messageNotifications.map((notification) => ({
      ...notification,
      notificationType: mapNotificationType(notification.type),
    })),
  ]
    .filter((item) => !dismissedKeys.has(item.notificationType + '-' + item.id)) // THÊM MỚI
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)),
  [friendRequests, messageNotifications, dismissedKeys]); // THÊM dismissedKeys vào deps

  useEffect(() => {
    onUnreadCountChange?.(notifications.length);
  }, [notifications.length, onUnreadCountChange]);

  const respondToRequest = async (request, action) => {
    const question = action === 'accept'
      ? 'Bạn có chắc muốn chấp nhận lời mời kết bạn này không?'
      : 'Bạn có chắc muốn từ chối lời mời kết bạn này không?';
    if (!window.confirm(question)) return;

    setActingRequestId(String(request.id));
    try {
      const res = await fetchWithAuth(API.respondFriendRequest(request.id), {
        method: 'PUT',
        body: JSON.stringify({ action }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Không thể xử lý lời mời kết bạn');

      setFriendRequests((current) => current.filter((item) => String(item.id) !== String(request.id)));
      window.dispatchEvent(new Event(FRIEND_STATUS_EVENT));
    } catch (error) {
      window.alert(error.message || 'Không thể xử lý lời mời kết bạn');
    } finally {
      setActingRequestId(null);
    }
  };

  const markWelcomeAsRead = async (notification) => {
    try {
      const res = await fetchWithAuth(API.markWelcomeNotificationRead, { method: 'PUT' });
      if (!res.ok) throw new Error('Không thể cập nhật thông báo');
      setMessageNotifications((current) => current.filter((item) => String(item.id) !== String(notification.id)));
    } catch (error) {
      console.error('Could not mark welcome notification as read:', error);
    }
  };

  const copyRewardCode = async (notification) => {
    const code = notification.meta?.couponCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(String(notification.id));
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Could not copy coupon code:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.notificationPanel} role="dialog" aria-label="Notifications">
      <div className={styles.notificationHeader}>
        <div>
          <h2>Thông báo</h2>
          <p>Lời mời kết bạn, tin nhắn và phần thưởng mới</p>
        </div>
      </div>

      <div className={styles.notificationList}>
        {loading && notifications.length === 0 ? (
          <div className={styles.notificationEmpty}>Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.notificationEmpty}>
            <div className={styles.emptyBell} aria-hidden="true">
              <MessageCircle size={22} />
            </div>
            <strong>Bạn hiện chưa có thông báo nào</strong>
            <span>Lời mời kết bạn và tin nhắn mới sẽ hiển thị ở đây.</span>
          </div>
        ) : (
          notifications.map((notification) => {
            const isFriendRequest = notification.notificationType === 'friend';
            const isWelcome = notification.notificationType === 'welcome';
            const isReward = notification.notificationType === 'reward';
            const isMessage = notification.notificationType === 'message';
            const isActing = actingRequestId === String(notification.id);
            const isCopied = copiedCode === String(notification.id);

            return (
              <article
                key={notification.notificationType + '-' + notification.id}
                className={styles.notificationItem + ' ' + styles.notificationUnread}
                role={isMessage || isWelcome ? 'button' : undefined}
                tabIndex={isMessage || isWelcome ? 0 : undefined}
                onClick={() => {
                  if (isWelcome) {
                    markWelcomeAsRead(notification);
                  } else if (isMessage) {
                    onOpenMessage?.(notification);
                  }
                }}
                onKeyDown={(event) => {
                  if ((isMessage || isWelcome) && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    if (isWelcome) markWelcomeAsRead(notification);
                    else onOpenMessage?.(notification);
                  }
                }}
              >
                <div className={
                  styles.notificationIcon + ' ' +
                  (isFriendRequest ? styles.friendIcon : isReward ? styles.rewardIcon : styles.messageIcon)
                }>
                  {isFriendRequest ? <UserPlus size={17} /> : isReward ? <Gift size={17} /> : <MessageCircle size={17} />}
                </div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationItemTopline}>
                    <strong>
                      {isFriendRequest ? 'Lời mời kết bạn' : isWelcome ? 'Chào mừng' : isReward ? 'Trúng thưởng sự kiện' : 'Tin nhắn mới'}
                    </strong>
                    <span className={styles.unreadDot} aria-label="Unread" />
                    <button
                      type="button"
                      className={styles.dismissBtn}
                      aria-label="Delete thông báo"
                      onClick={(event) => dismissNotification(event, notification)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className={styles.notificationMessage}>{notification.message}</p>
                  <div className={styles.notificationMeta}>
                    {notification.actorName}
                    {notification.createdAt && (
                      <span><Clock3 size={12} /> {formatDate(notification.createdAt)}</span>
                    )}
                  </div>

                  {isFriendRequest && (
                    <div className={styles.notificationActions}>
                      <button
                        type="button"
                        className={styles.acceptBtn}
                        disabled={isActing}
                        onClick={(event) => {
                          event.stopPropagation();
                          respondToRequest(notification, 'accept');
                        }}
                      >
                        <Check size={14} /> Chấp nhận
                      </button>
                      <button
                        type="button"
                        className={styles.rejectBtn}
                        disabled={isActing}
                        onClick={(event) => {
                          event.stopPropagation();
                          respondToRequest(notification, 'reject');
                        }}
                      >
                        <X size={14} /> Từ chối
                      </button>
                    </div>
                  )}

                  {isReward && notification.meta?.couponCode && (
                    <div className={styles.notificationActions}>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={(event) => {
                          event.stopPropagation();
                          copyRewardCode(notification);
                        }}
                      >
                        <Copy size={14} /> {isCopied ? 'Đã sao chép!' : `Sao chép mã ${notification.meta.couponCode}`}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}