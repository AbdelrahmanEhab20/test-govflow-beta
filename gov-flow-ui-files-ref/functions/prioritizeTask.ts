import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            taskTitle,
            taskDescription,
            dueDate,
            dependencies,
            currentPriority,
            assignedUserCount,
            status
        } = await req.json();

        if (!taskTitle || !taskDescription) {
            return Response.json({ error: 'Task title and description are required' }, { status: 400 });
        }

        const today = new Date();
        const due = dueDate ? new Date(dueDate) : null;
        const daysUntilDue = due ? Math.ceil((due - today) / (1000 * 60 * 60 * 24)) : null;

        const prompt = `You are an expert task prioritization AI. Analyze the following task details and suggest an optimal priority level.

Task Title: ${taskTitle}
Description: ${taskDescription}
Due Date: ${dueDate || 'Not set'}
Days Until Due: ${daysUntilDue !== null ? daysUntilDue : 'N/A'}
Dependencies: ${dependencies || 'None'}
Current Priority: ${currentPriority || 'Not set'}
Assigned Team Members: ${assignedUserCount || 'None'}
Status: ${status || 'not_started'}

Based on the above information, suggest a priority level from: low, medium, high, urgent

Consider these factors:
1. Time sensitivity: Tasks due soon (< 3 days) or overdue should be higher priority
2. Dependencies: Tasks blocking others should be higher priority
3. Team size: Tasks assigned to larger teams might need higher priority for coordination
4. Description complexity: Complex tasks with detailed descriptions might warrant higher priority
5. Current status: Tasks already in progress might need adjustment

Return a JSON response with:
{
  "suggestedPriority": "low|medium|high|urgent",
  "reasoning": "Brief explanation of why this priority was suggested",
  "confidence": "high|medium|low"
}`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    suggestedPriority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'urgent']
                    },
                    reasoning: {
                        type: 'string'
                    },
                    confidence: {
                        type: 'string',
                        enum: ['high', 'medium', 'low']
                    }
                },
                required: ['suggestedPriority', 'reasoning', 'confidence']
            }
        });

        return Response.json({
            suggestedPriority: response.suggestedPriority,
            reasoning: response.reasoning,
            confidence: response.confidence
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});