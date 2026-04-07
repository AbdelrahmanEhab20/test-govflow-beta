import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

export function CompletionRateCard({ initiatives = [] }) {
  const total = initiatives.length;
  const completed = initiatives.filter(i => i.status === 'completed').length;
  const inProgress = initiatives.filter(i => i.status === 'in_progress').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const data = [
    { name: 'Completed', value: completed, fill: '#10b981' },
    { name: 'In Progress', value: inProgress, fill: '#3b82f6' },
    { name: 'Other', value: total - completed - inProgress, fill: '#f3f4f6' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Task Completion Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="text-4xl font-bold text-green-600">{rate}%</div>
            <div className="text-sm text-slate-600">
              {completed} of {total} tasks completed
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function AverageProgressCard({ initiatives = [] }) {
  const avg = initiatives.length > 0
    ? Math.round(initiatives.reduce((sum, i) => sum + (i.completion_percent || 0), 0) / initiatives.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Average Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-4xl font-bold text-blue-600">{avg}%</div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${avg}%` }}
            />
          </div>
          <p className="text-sm text-slate-600">
            Across {initiatives.length} initiatives
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverdueTasksCard({ initiatives = [] }) {
  const today = new Date();
  const overdue = initiatives.filter(i => {
    if (!i.due_date || i.status === 'completed') return false;
    return new Date(i.due_date) < today;
  }).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Overdue Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-4xl font-bold text-red-600">{overdue}</div>
          <p className="text-sm text-slate-600">
            Tasks past due date
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DueThisWeekCard({ initiatives = [] }) {
  const today = new Date();
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const dueThisWeek = initiatives.filter(i => {
    if (!i.due_date || i.status === 'completed') return false;
    const dueDate = new Date(i.due_date);
    return dueDate >= today && dueDate <= weekEnd;
  }).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          Due This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-4xl font-bold text-amber-600">{dueThisWeek}</div>
          <p className="text-sm text-slate-600">
            Tasks due in next 7 days
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusDistributionChart({ initiatives = [] }) {
  const data = [
    { status: 'Not Started', count: initiatives.filter(i => i.status === 'not_started').length, fill: '#94a3b8' },
    { status: 'In Progress', count: initiatives.filter(i => i.status === 'in_progress').length, fill: '#3b82f6' },
    { status: 'Completed', count: initiatives.filter(i => i.status === 'completed').length, fill: '#10b981' },
    { status: 'On Hold', count: initiatives.filter(i => i.status === 'on_hold').length, fill: '#f59e0b' },
    { status: 'Delayed', count: initiatives.filter(i => i.status === 'delayed').length, fill: '#ef4444' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ProgressTrendChart({ initiatives = [] }) {
  const sortedInitiatives = [...initiatives].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  
  const data = sortedInitiatives.slice(-10).map((init, index) => ({
    name: init.pillar?.substring(0, 15) || 'Task',
    progress: init.completion_percent || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Trend (Last 10 Initiatives)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PriorityBreakdownChart({ initiatives = [] }) {
  const data = [
    { priority: 'Urgent', count: initiatives.filter(i => i.priority === 'urgent').length, fill: '#ef4444' },
    { priority: 'High', count: initiatives.filter(i => i.priority === 'high').length, fill: '#f59e0b' },
    { priority: 'Medium', count: initiatives.filter(i => i.priority === 'medium').length, fill: '#3b82f6' },
    { priority: 'Low', count: initiatives.filter(i => i.priority === 'low').length, fill: '#10b981' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="priority" type="category" width={80} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}