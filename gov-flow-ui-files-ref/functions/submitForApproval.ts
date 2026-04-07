import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { task_id } = await req.json();

    const task = await base44.asServiceRole.entities.Initiative.get(task_id);
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task requires approval
    if (!task.requires_approval || !task.approval_required_from || task.approval_required_from.length === 0) {
      return Response.json({ error: 'Task does not require approval' }, { status: 400 });
    }

    // Create approval records
    const approvals = [];
    for (let i = 0; i < task.approval_required_from.length; i++) {
      const approverId = task.approval_required_from[i];
      const approver = await base44.asServiceRole.entities.User.get(approverId);
      
      const approval = await base44.asServiceRole.entities.TaskApproval.create({
        task_id: task_id,
        approver_user_id: approverId,
        approver_name: approver?.full_name || 'Unknown',
        status: 'pending',
        sequence_order: i,
        is_sequential: true
      });
      
      approvals.push(approval);

      // Notify approver
      await base44.asServiceRole.entities.Notification.create({
        user_id: approverId,
        type: 'approval_required',
        title: 'Task Approval Required',
        message: `Approval needed for: ${task.pillar}`,
        entity_type: 'task',
        entity_id: task_id,
        is_read: false
      });
    }

    // Update task status
    await base44.asServiceRole.entities.Initiative.update(task_id, {
      approval_status: 'submitted'
    });

    return Response.json({
      success: true,
      approvals,
      message: 'Task submitted for approval'
    });
  } catch (error) {
    console.error('Error in submitForApproval:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});