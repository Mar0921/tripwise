import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelenceQuery, modelenceMutation, createQueryKey } from '@modelence/react-query';
import toast from 'react-hot-toast';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent } from '@/client/components/ui/Card';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import { Notification } from '@/client/types/tripwise';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationCard({
  notification,
  onMarkRead,
  isMarkingRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}) {
  return (
    <Card className={notification.isRead ? 'bg-gray-50' : 'bg-white border-blue-200'}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-2 h-2 mt-2 rounded-full ${notification.isRead ? 'bg-gray-300' : 'bg-blue-500'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
              {notification.message}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</span>
              <Link
                to={`/trips/${notification.tripId}`}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                View Trip
              </Link>
              {!notification.isRead && (
                <button
                  onClick={() => onMarkRead(notification._id)}
                  disabled={isMarkingRead}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
      <p className="text-gray-500 mb-6">
        You'll receive notifications when weather conditions change for your upcoming trips.
      </p>
      <Link to="/">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, error } = useQuery({
    ...modelenceQuery<Notification[]>('tripwise.getNotifications'),
  });

  const { mutate: markRead, isPending: isMarkingRead } = useMutation({
    ...modelenceMutation('tripwise.markNotificationRead'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getNotifications') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getUnreadNotificationCount') });
    },
    onError: (error) => {
      toast.error(`Failed to mark as read: ${(error as Error).message}`);
    },
  });

  const { mutate: markAllRead, isPending: isMarkingAllRead } = useMutation({
    ...modelenceMutation('tripwise.markAllNotificationsRead'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getNotifications') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getUnreadNotificationCount') });
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error(`Failed to mark all as read: ${(error as Error).message}`);
    },
  });

  const handleMarkRead = useCallback((notificationId: string) => {
    markRead({ notificationId });
  }, [markRead]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead({});
  }, [markAllRead]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  if (isLoading) {
    return (
      <Page className="bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page className="bg-gray-50">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-red-600">Error loading notifications: {(error as Error).message}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page className="bg-gray-50">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {!notifications || notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onMarkRead={handleMarkRead}
                isMarkingRead={isMarkingRead}
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
