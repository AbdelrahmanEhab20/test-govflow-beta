import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { task_id, desired_status } = await req.json();

    // Get all dependencies for this task
    const dependencies = await base44.asServiceRole.entities.TaskDependency.filter({
      dependent_task_id: task_id,
      is_active: true
    });

    if (dependencies.length === 0) {
      return Response.json({ can_proceed: true });
    }

    // Check if all prerequisites are met
    const violations = [];

    for (const dep of dependencies) {
      const prerequisite = await base44.asServiceRole.entities.Initiative.get(dep.prerequisite_task_id);
      
      if (!prerequisite) continue;

      let isMetForType = false;

      switch (dep.dependency_type) {
        case 'finish_to_start':
          // Prerequisite must be completed
          isMetForType = prerequisite.status === 'completed';
          if (!isMetForType) {
            violations.push({
              prerequisite_id: dep.prerequisite_task_id,
              prerequisite_title: prerequisite.pillar,
              reason: 'Prerequisite task must be completed',
              dependency_type: dep.dependency_type
            });
          }
          break;
        
        case 'finish_to_finish':
          // Both must be completed at same time
          isMetForType = desired_status === 'completed' && prerequisite.status !== 'completed';
          if (isMetForType) {
            violations.push({
              prerequisite_id: dep.prerequisite_task_id,
              prerequisite_title: prerequisite.pillar,
              reason: 'Both tasks must finish together',
              dependency_type: dep.dependency_type
            });
          }
          break;
        
        case 'start_to_start':
          // Prerequisite must be started
          isMetForType = ['not_started'].includes(prerequisite.status);
          if (isMetForType) {
            violations.push({
              prerequisite_id: dep.prerequisite_task_id,
              prerequisite_title: prerequisite.pillar,
              reason: 'Prerequisite task must be started',
              dependency_type: dep.dependency_type
            });
          }
          break;
        
        case 'start_to_finish':
          // This task can't start until prerequisite finishes
          isMetForType = desired_status === 'in_progress' && prerequisite.status !== 'completed';
          if (isMetForType) {
            violations.push({
              prerequisite_id: dep.prerequisite_task_id,
              prerequisite_title: prerequisite.pillar,
              reason: 'Prerequisite must be completed before starting',
              dependency_type: dep.dependency_type
            });
          }
          break;
      }
    }

    return Response.json({
      can_proceed: violations.length === 0,
      violations
    });
  } catch (error) {
    console.error('Error in validateTaskDependencies:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});