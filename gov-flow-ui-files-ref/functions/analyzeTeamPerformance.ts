import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { initiatives = [], teamMembers = [], departments = [], selectedSector = '', selectedDepartment = '' } = await req.json();

    if (!initiatives || initiatives.length === 0) {
      return Response.json({
        insights: [],
        recommendations: [],
        alerts: []
      });
    }

    // Prepare data summary for analysis
    const completedCount = initiatives.filter(i => i.status === 'completed').length;
    const inProgressCount = initiatives.filter(i => i.status === 'in_progress').length;
    const overdueCount = initiatives.filter(i => i.status === 'delayed').length;
    const avgCompletion = Math.round(
      initiatives.reduce((sum, i) => sum + (i.completion_percent || 0), 0) / initiatives.length
    );

    const highPriorityCount = initiatives.filter(i => i.priority === 'high' || i.priority === 'urgent').length;
    const highPriorityIncomplete = initiatives.filter(
      i => (i.priority === 'high' || i.priority === 'urgent') && i.status !== 'completed'
    ).length;

    const departmentPerformance = {};
    initiatives.forEach(init => {
      const dept = init.lead_user_name ? 
        teamMembers.find(m => m.name === init.lead_user_name)?.department_name : 'Unknown';
      
      if (!departmentPerformance[dept]) {
        departmentPerformance[dept] = { total: 0, completed: 0, overdue: 0 };
      }
      departmentPerformance[dept].total++;
      if (init.status === 'completed') departmentPerformance[dept].completed++;
      if (init.status === 'delayed') departmentPerformance[dept].overdue++;
    });

    const prompt = `
You are an expert team performance analyst. Analyze the following team performance data and provide:
1. Key Performance Insights (3-4 main insights)
2. Actionable Recommendations (3-4 recommendations)
3. Critical Alerts (if any critical issues exist)

DATA SUMMARY:
- Total Initiatives: ${initiatives.length}
- Completed: ${completedCount} (${Math.round((completedCount / initiatives.length) * 100)}%)
- In Progress: ${inProgressCount}
- Delayed/Overdue: ${overdueCount}
- Average Completion: ${avgCompletion}%
- High Priority Tasks: ${highPriorityCount} (${highPriorityIncomplete} incomplete)
- Selected Sector: ${selectedSector || 'All Sectors'}
- Selected Department: ${selectedDepartment || 'All Departments'}

DEPARTMENT BREAKDOWN:
${Object.entries(departmentPerformance).map(([dept, stats]) => 
  `${dept}: ${stats.completed}/${stats.total} completed, ${stats.overdue} overdue`
).join('\n')}

INITIATIVE SAMPLE DATA (first 5):
${initiatives.slice(0, 5).map(init => 
  `- ${init.pillar}: ${init.status} (${init.completion_percent}% complete, Priority: ${init.priority})`
).join('\n')}

Provide response in JSON format:
{
  "insights": [
    { "title": "string", "description": "string", "severity": "info|warning|success" }
  ],
  "recommendations": [
    { "title": "string", "description": "string", "department": "string (optional)", "impact": "high|medium|low" }
  ],
  "alerts": [
    { "title": "string", "description": "string", "severity": "critical|warning|info", "action": "string" }
  ]
}`;

    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                severity: { type: 'string', enum: ['info', 'warning', 'success'] }
              }
            }
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                department: { type: 'string' },
                impact: { type: 'string', enum: ['high', 'medium', 'low'] }
              }
            }
          },
          alerts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
                action: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json(analysisResult);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});