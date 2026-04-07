import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objective } = await req.json();

    if (!objective) {
      return Response.json({ error: 'Objective is required' }, { status: 400 });
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a task management expert. Based on the following high-level objective, generate a detailed task description and 3-5 concrete subtasks.

Objective: "${objective}"

Return a JSON response with this structure:
{
  "description": "A detailed description of the task",
  "subtasks": [
    "Subtask 1",
    "Subtask 2",
    "Subtask 3"
  ]
}

Be specific, actionable, and professional.`,
      response_json_schema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          subtasks: { type: 'array', items: { type: 'string' } }
        },
        required: ['description', 'subtasks']
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});