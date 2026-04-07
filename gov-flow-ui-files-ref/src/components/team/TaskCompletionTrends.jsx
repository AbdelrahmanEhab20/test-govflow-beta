import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export default function TaskCompletionTrends({ tasks }) {
  // Generate data for the last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    days.push(startOfDay(subDays(new Date(), i)));
  }

  const data = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const createdCount = tasks.filter(t => {
      const created = new Date(t.created_date);
      return created >= dayStart && created < dayEnd;
    }).length;

    const completedCount = tasks.filter(t => {
      if (t.status !== 'completed') return false;
      const updated = new Date(t.updated_date);
      return updated >= dayStart && updated < dayEnd;
    }).length;

    return {
      date: format(day, 'MMM d'),
      created: createdCount,
      completed: completedCount
    };
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Task Completion Trends (14 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="created" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="Created"
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              name="Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}