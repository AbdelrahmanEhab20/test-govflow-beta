import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all active tasks with due dates
    const tasks = await base44.asServiceRole.entities.Initiative.filter({
      status: { $ne: 'completed' }
    });

    const now = new Date();
    const notifications = [];

    for (const task of tasks) {
      if (!task.due_date || !task.lead_user_id) continue;

      const dueDate = new Date(task.due_date);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

      // Check if overdue
      if (daysUntilDue < 0) {
        // Check if notification already sent
        const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
          user_id: task.lead_user_id,
          entity_id: task.id,
          type: 'overdue'
        });

        if (existingNotifs.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: task.lead_user_id,
            type: 'overdue',
            title: '🚨 Task Overdue',
            message: `Task "${task.pillar}" is ${Math.abs(daysUntilDue)} day(s) overdue`,
            entity_type: 'task',
            entity_id: task.id,
            is_read: false
          });
          notifications.push({ type: 'overdue', task: task.pillar });
        }
      }
      // Check if due soon (within 2 days)
      else if (daysUntilDue >= 0 && daysUntilDue <= 2) {
        const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
          user_id: task.lead_user_id,
          entity_id: task.id,
          type: 'due_soon'
        });

        if (existingNotifs.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: task.lead_user_id,
            type: 'due_soon',
            title: '⏰ Task Due Soon',
            message: `Task "${task.pillar}" is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day(s)`}`,
            entity_type: 'task',
            entity_id: task.id,
            is_read: false
          });
          notifications.push({ type: 'due_soon', task: task.pillar, days: daysUntilDue });
        }
      }
    }

    return Response.json({ 
      success: true, 
      notifications_created: notifications.length,
      details: notifications
    });
  } catch (error) {
    console.error('Error checking due dates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});