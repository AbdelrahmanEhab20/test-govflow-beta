import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/api/authApi';
import { listNotificationsForUser } from '@/api/notificationsApi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

const STORAGE_KEY = 'govflow_assignment_toast_ids';

function loadToastIds() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveToastIds(set) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

/**
 * Shows top-right toast alerts for unread task-assignment notifications (in-app).
 * Dedupes per browser session so the same notification is not toasted repeatedly.
 */
export default function AssignmentToastListener() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const shownRef = useRef(loadToastIds());

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => listNotificationsForUser(user?.id),
    enabled: !!user?.id,
    refetchInterval: 12000,
  });

  useEffect(() => {
    if (!user?.id || !notifications.length) return;

    const assignmentUnread = notifications.filter(
      (n) =>
        !n.is_read &&
        (n.type === 'assignment' || n.type === 'task_assigned') &&
        n.related_task_id,
    );

    for (const n of assignmentUnread) {
      if (shownRef.current.has(n.id)) continue;
      shownRef.current.add(n.id);
      saveToastIds(shownRef.current);

      const taskId = n.related_task_id;
      toast({
        title: n.title || 'New task assigned',
        description: n.message || 'You have a new assignment.',
        duration: 9000,
        action: (
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={() => navigate(createPageUrl(`TaskDetail?id=${taskId}`))}
          >
            Open task
          </Button>
        ),
      });
    }
  }, [notifications, user?.id, toast, navigate]);

  return null;
}
