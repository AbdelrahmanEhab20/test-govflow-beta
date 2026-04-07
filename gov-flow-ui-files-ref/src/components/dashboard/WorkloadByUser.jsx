import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import UserAvatar from "../shared/UserAvatar";

export default function WorkloadByUser({ tasks = [], users = [] }) {
  const workloadData = users.map(user => {
    const userTasks = tasks.filter(t => 
      t.lead_user_id === user.id && t.status !== 'completed'
    );
    const avgCompletion = userTasks.length > 0
      ? Math.round(userTasks.reduce((sum, t) => sum + (t.completion_percent || 0), 0) / userTasks.length)
      : 0;
    
    return {
      name: user.full_name?.split(' ')[0] || 'Unknown',
      fullName: user.full_name,
      tasks: userTasks.length,
      avgCompletion,
      user
    };
  }).filter(d => d.tasks > 0).sort((a, b) => b.tasks - a.tasks).slice(0, 8);

  const getBarColor = (tasks) => {
    if (tasks > 10) return "#ef4444";
    if (tasks > 5) return "#f59e0b";
    return "#3b82f6";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workload by Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        {workloadData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-500">No workload data available</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border">
                        <p className="font-medium">{data.fullName}</p>
                        <p className="text-sm text-slate-600">{data.tasks} open tasks</p>
                        <p className="text-sm text-slate-600">{data.avgCompletion}% avg completion</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="tasks" radius={[0, 4, 4, 0]}>
                  {workloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.tasks)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}