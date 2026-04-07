import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskTitle, taskDescription, priority } = await req.json();

    if (!taskTitle || !taskDescription) {
      return Response.json({ error: 'Task title and description are required' }, { status: 400 });
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following task and suggest appropriate categorization and tags.

Task Title: "${taskTitle}"
Description: "${taskDescription}"
Priority: "${priority || 'medium'}"

Return a JSON response with:
{
  "suggestedPriority": "low|medium|high|urgent",
  "suggestedStatus": "not_started|in_progress|on_hold",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "A short category name (max 2 words)"
}

Consider the task complexity, dependencies, and urgency when suggesting priority.`,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestedPriority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent']
          },
          suggestedStatus: {
            type: 'string',
            enum: ['not_started', 'in_progress', 'on_hold']
          },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          category: { type: 'string' }
        },
        required: ['suggestedPriority', 'tags', 'category']
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});