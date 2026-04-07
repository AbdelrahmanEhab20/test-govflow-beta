import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, taskData } = await req.json();

    if (!taskId || !taskData) {
      return Response.json({ error: 'Missing taskId or taskData' }, { status: 400 });
    }

    // Fetch all users and initiatives
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allInitiatives = await base44.asServiceRole.entities.Initiative.list();

    // Build user profiles with performance metrics
    const userProfiles = allUsers.map(u => {
      const ledTasks = allInitiatives.filter(i => i.lead_user_id === u.id);
      const completedTasks = ledTasks.filter(i => i.status === 'completed').length;
      const avgCompletion = ledTasks.length > 0
        ? Math.round(ledTasks.reduce((sum, i) => sum + (i.completion_percent || 0), 0) / ledTasks.length)
        : 0;

      return {
        id: u.id,
        name: u.full_name,
        email: u.email,
        department: u.department,
        position: u.position,
        taskCount: ledTasks.length,
        completedCount: completedTasks,
        completionRate: ledTasks.length > 0 ? Math.round((completedTasks / ledTasks.length) * 100) : 0,
        avgProgressPercent: avgCompletion,
      };
    });

    // Create a detailed prompt for the LLM
    const prompt = `
You are an expert task assignment system. Given a task description and a list of team members with their metrics, suggest the top 3 most suitable users to assign this task to.

TASK TO ASSIGN:
- Title: ${taskData.pillar}
- Description: ${taskData.brief_description || 'No description'}
- Priority: ${taskData.priority}
- Status: ${taskData.status}
- Due Date: ${taskData.due_date}
- Deliverables: ${taskData.deliverables || 'Not specified'}

TEAM MEMBERS AVAILABLE:
${userProfiles.map(u => `
- Name: ${u.name}
  Email: ${u.email}
  Department: ${u.department}
  Position: ${u.position}
  Current Tasks: ${u.taskCount}
  Completion Rate: ${u.completionRate}%
  Avg Progress: ${u.avgProgressPercent}%
`).join('')}

Based on the task requirements and team member profiles, suggest the top 3 most suitable users to assign this task to.

Consider:
1. Task complexity and required skills based on position
2. Current workload (fewer active tasks = more available)
3. Department alignment
4. Past completion rates and performance
5. Average progress capability

Return a JSON response with this exact structure:
{
  "suggestions": [
    {
      "userId": "user_id",
      "userName": "Full Name",
      "score": 95,
      "reasoning": "Brief explanation why this user is a good fit"
    },
    {
      "userId": "user_id",
      "userName": "Full Name",
      "score": 85,
      "reasoning": "Brief explanation why this user is a good fit"
    },
    {
      "userId": "user_id",
      "userName": "Full Name",
      "score": 75,
      "reasoning": "Brief explanation why this user is a good fit"
    }
  ]
}
`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                userName: { type: 'string' },
                score: { type: 'number' },
                reasoning: { type: 'string' },
              },
            },
          },
        },
      },
    });

    return Response.json({
      suggestions: llmResponse.suggestions || [],
      userProfiles,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});