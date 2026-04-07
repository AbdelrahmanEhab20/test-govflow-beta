import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { addDays, addWeeks, addMonths, addYears, format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all recurring tasks
    const recurringTasks = await base44.asServiceRole.entities.Initiative.filter({
      is_recurring: true,
      is_archived: false
    });

    if (!recurringTasks || recurringTasks.length === 0) {
      return Response.json({ success: true, message: 'No recurring tasks found', created: 0 });
    }

    const today = new Date();
    const createdInstances = [];

    const getNextDate = (startDate, pattern) => {
      const date = new Date(startDate);
      switch (pattern) {
        case 'daily':
          return addDays(date, 1);
        case 'weekly':
          return addWeeks(date, 1);
        case 'monthly':
          return addMonths(date, 1);
        case 'yearly':
          return addYears(date, 1);
        default:
          return date;
      }
    };

    // Process each recurring task
    for (const parentTask of recurringTasks) {
      try {
        // Check if we already created an instance today
        const existingInstances = await base44.asServiceRole.entities.Initiative.filter({
          parent_task_id: parentTask.id
        }, '-created_date', 1);

        if (existingInstances.length > 0) {
          const lastInstance = existingInstances[0];
          const lastCreated = new Date(lastInstance.created_date);
          const daysSinceLastCreation = Math.floor((today - lastCreated) / (1000 * 60 * 60 * 24));
          
          // Skip if already created today
          if (daysSinceLastCreation < 1) {
            continue;
          }
        }

        const nextInstanceDate = getNextDate(parentTask.due_date || parentTask.start_date, parentTask.recurrence_pattern);

        // Check if next instance should be created
        if (parentTask.recurrence_end_date && nextInstanceDate > new Date(parentTask.recurrence_end_date)) {
          continue;
        }

        // Create new instance
        const newInstance = await base44.asServiceRole.entities.Initiative.create({
          pillar: parentTask.pillar,
          brief_description: parentTask.brief_description,
          lead_user_id: parentTask.lead_user_id,
          lead_user_name: parentTask.lead_user_name,
          support_users: parentTask.support_users,
          support_user_names: parentTask.support_user_names,
          deliverables: parentTask.deliverables,
          start_date: format(nextInstanceDate, 'yyyy-MM-dd'),
          due_date: format(nextInstanceDate, 'yyyy-MM-dd'),
          status: 'not_started',
          completion_percent: 0,
          priority: parentTask.priority,
          stakeholders: parentTask.stakeholders,
          tags: parentTask.tags,
          is_recurring: false,
          parent_task_id: parentTask.id,
          workflow_stage_id: parentTask.workflow_stage_id
        });

        createdInstances.push(newInstance.id);
      } catch (taskError) {
        console.error(`Error processing task ${parentTask.id}:`, taskError);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Created ${createdInstances.length} recurring task instances`,
      created: createdInstances.length,
      instances: createdInstances
    });
  } catch (error) {
    console.error('Error in createRecurringTaskInstances:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});