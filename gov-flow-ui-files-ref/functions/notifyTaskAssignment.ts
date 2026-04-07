import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'update') {
      return Response.json({ success: true });
    }

    const task = data;
    if (!task || (!task.lead_user_id && !task.lead_user_name)) {
      return Response.json({ success: true });
    }

    // Get assignee details — try by ID first, then fall back to email lookup
    let assignee = null;

    if (task.lead_user_id) {
      try {
        assignee = await base44.asServiceRole.entities.User.get(task.lead_user_id);
      } catch (_) {
        // ID not found, will try by email below
      }
    }

    // Fall back: look up by email if stored in lead_user_id, or by name
    if (!assignee) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      assignee = allUsers.find(u =>
        u.id === task.lead_user_id ||
        u.email === task.lead_user_id ||
        u.full_name === task.lead_user_name
      ) || null;
    }

    if (!assignee) {
      console.log(`Could not resolve user for task ${task.id}, lead_user_id=${task.lead_user_id}, lead_user_name=${task.lead_user_name}. Skipping.`);
      return Response.json({ success: true, message: 'User not found, skipped' });
    }

    // Check notification preferences
    const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({
      user_id: assignee.id
    });
    
    const preference = prefs[0];
    if (!preference) {
      return Response.json({ success: true });
    }

    // Create in-app notification if enabled
    if (preference.notify_task_assigned) {
      await base44.asServiceRole.entities.Notification.create({
        user_id: assignee.id,
        type: 'assignment',
        title: 'New Task Assigned',
        message: `You have been assigned to: ${task.pillar}`,
        entity_type: 'task',
        entity_id: task.id,
        is_read: false,
        is_email_sent: false
      });
    }

    // Send email if enabled
    if (preference.notify_task_assigned_email && assignee.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: assignee.email,
        subject: `New Task Assigned: ${task.pillar}`,
        body: `
          <h2>New Task Assigned</h2>
          <p>Hi ${assignee.full_name},</p>
          <p>You have been assigned to the following task:</p>
          <h3>${task.pillar}</h3>
          <p><strong>Status:</strong> ${task.status || 'Not started'}</p>
          <p><strong>Priority:</strong> ${task.priority || 'Medium'}</p>
          ${task.due_date ? `<p><strong>Due Date:</strong> ${task.due_date}</p>` : ''}
          ${task.brief_description ? `<p><strong>Description:</strong> ${task.brief_description}</p>` : ''}
          <p>Log in to the system to view more details and take action.</p>
        `
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in notifyTaskAssignment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});