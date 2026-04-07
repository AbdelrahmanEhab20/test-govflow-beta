import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, userId, initiativeData } = await req.json();

    if (!taskId || !userId) {
      return Response.json({ error: 'Missing taskId or userId' }, { status: 400 });
    }

    // Update initiative with the assigned user
    const updatedInitiative = await base44.asServiceRole.entities.Initiative.update(taskId, {
      lead_user_id: userId,
    });

    // Get the assigned user details
    const assignedUser = await base44.asServiceRole.entities.User.get(userId);

    // Create notification for the assigned user
    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      type: 'assignment',
      title: `New Task Assignment: ${initiativeData.pillar}`,
      message: `You have been assigned to lead the task "${initiativeData.pillar}" with ${initiativeData.priority} priority.`,
      entity_type: 'task',
      entity_id: taskId,
      is_read: false,
    });

    // Send email notification
    if (assignedUser?.email) {
      await base44.integrations.Core.SendEmail({
        to: assignedUser.email,
        subject: `New Task Assignment: ${initiativeData.pillar}`,
        body: `Hi ${assignedUser.full_name},

You have been assigned to lead the following task:

Task: ${initiativeData.pillar}
Priority: ${initiativeData.priority}
Due Date: ${initiativeData.due_date || 'Not set'}
Description: ${initiativeData.brief_description || 'No description provided'}

Please log in to the system to view full details and start working on this task.

Best regards,
Task Management System`,
      });
    }

    return Response.json({
      success: true,
      updatedInitiative,
      message: `Task assigned to ${assignedUser?.full_name}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});