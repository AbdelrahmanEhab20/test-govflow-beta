const TASK_DETAIL_TYPES = new Set([
  'assignment',
  'task_assigned',
  'due_soon',
  'overdue',
  'approval_required',
  'status_change',
]);

/**
 * Returns a page route string (without base path) for navigation, or null if none.
 */
export function getNotificationRoute(notification) {
  if (!notification) return null;

  const { type, related_task_id: taskId, related_email_id: emailId } = notification;

  if (emailId) {
    return `EmailInbox?id=${emailId}`;
  }

  if (taskId && TASK_DETAIL_TYPES.has(type)) {
    return `TaskDetail?id=${taskId}`;
  }

  if (type === 'department_change') {
    return 'DepartmentManagement';
  }

  if (type === 'routing_rule_change') {
    return 'RoutingRules';
  }

  return null;
}

export function notificationHasNavigation(notification) {
  return Boolean(getNotificationRoute(notification));
}
