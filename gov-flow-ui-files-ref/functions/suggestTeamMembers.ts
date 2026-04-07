import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskDescription, taskTitle } = await req.json();

    if (!taskDescription || !taskTitle) {
      return Response.json({ error: 'Task description and title are required' }, { status: 400 });
    }

    // Fetch all users and their task workloads
    const users = await base44.entities.User.list();
    const tasks = await base44.entities.Initiative.list();

    // Calculate workload for each user
    const userWorkloads = users.map(u => {
      const userTasks = tasks.filter(t => t.lead_user_id === u.id && t.status !== 'completed');
      return {
        id: u.id,
        name: u.full_name,
        openTasks: userTasks.length,
        avgCompletion: userTasks.length > 0
          ? (userTasks.reduce((sum, t) => sum + (t.completion_percent || 0), 0) / userTasks.length)
          : 100
      };
    });

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a team resource manager. Based on the task description and current team workloads, suggest the best 2-3 team members to assign.

Task: "${taskTitle}"
Description: "${taskDescription}"

Team Members and their workload:
${userWorkloads.map(u => `- ${u.name}: ${u.openTasks} open tasks, ${u.avgCompletion.toFixed(0)}% avg completion`).join('\n')}

Return a JSON response with:
{
  "suggestions": [
    {
      "userId": "user_id",
      "name": "Full Name",
      "reason": "Brief reason why this person is suitable"
    }
  ]
}

Prioritize team members with lower workloads.`,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Match suggestions with actual user IDs
    const matchedSuggestions = response.suggestions.map(s => {
      const user = userWorkloads.find(u => u.name.toLowerCase() === s.name.toLowerCase());
      return {
        ...s,
        userId: user?.id || null
      };
    }).filter(s => s.userId);

    return Response.json({ suggestions: matchedSuggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});