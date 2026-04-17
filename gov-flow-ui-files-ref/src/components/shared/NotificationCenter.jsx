import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/authApi';
import { listNotificationsForUser, markNotificationRead, deleteNotification } from '@/api/notificationsApi';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter({ isOpen, onClose }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => listNotificationsForUser(user?.id),
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsRead = async () => {
    for (const notif of notifications.filter(n => !n.is_read)) {
      await markAsReadMutation.mutateAsync(notif.id);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      assignment: '📋',
      due_soon: '⏰',
      overdue: '🚨',
      mention: '👤',
      comment: '💬',
      status_change: '✨',
      approval_required: '⚠️'
    };
    return icons[type] || '📢';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Notification Panel */}
      <div className={`
        fixed right-0 top-16 w-96 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 
        border-l border-slate-200 dark:border-slate-800 shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="h-14 border-b dark:border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="border-b dark:border-slate-800 px-4 py-2 flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="h-[calc(100%-7rem)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-600 dark:text-slate-300">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-800">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    notif.is_read ? '' : 'bg-blue-50 dark:bg-blue-900/10'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                        {notif.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                        {notif.message}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                        {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!notif.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsReadMutation.mutate(notif.id)}
                          className="h-6 w-6"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotificationMutation.mutate(notif.id)}
                        className="h-6 w-6 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}