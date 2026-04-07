import React, { useState, useMemo } from "react";
import { listTasks } from "@/api/tasksApi";
import { listUsers } from "@/api/usersApi";
import { listEmails } from "@/api/emailApi";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import ProgressBar from "../components/shared/ProgressBar";
import OverdueTasksList from "../components/dashboard/OverdueTasksList";
import DueThisWeekList from "../components/dashboard/DueThisWeekList";
import RecentEmailsWidget from "../components/dashboard/RecentEmailsWidget";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('month');
  const [selectedLead, setSelectedLead] = useState('all');

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks({ orderBy: '-created_date' }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['emails'],
    queryFn: () => listEmails({}, '-received_at'),
  });

  // Filter tasks by date range
  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      if (dateRange === 'week') {
        startDate = subDays(now, 7);
      } else if (dateRange === 'month') {
        startDate = startOfMonth(now);
      } else if (dateRange === '3months') {
        startDate = subDays(now, 90);
      }
      
      result = result.filter(t => {
        if (!t.created_date) return false;
        return new Date(t.created_date) >= startDate;
      });
    }

    if (selectedLead !== 'all') {
      result = result.filter(t => t.lead_user_id === selectedLead);
    }

    return result;
  }, [tasks, dateRange, selectedLead]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const overdue = filteredTasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length;
    const avgCompletion = total > 0
      ? Math.round(filteredTasks.reduce((sum, t) => sum + (t.completion_percent || 0), 0) / total)
      : 0;
    const emailSourced = filteredTasks.filter(t => t.source_email_id).length;

    return { total, completed, inProgress, overdue, avgCompletion, emailSourced };
  }, [filteredTasks]);

  // Tasks by status chart data
  const statusChartData = useMemo(() => {
    const statusCounts = {
      'Not Started': filteredTasks.filter(t => t.status === 'not_started').length,
      'In Progress': filteredTasks.filter(t => t.status === 'in_progress').length,
      'Completed': filteredTasks.filter(t => t.status === 'completed').length,
      'On Hold': filteredTasks.filter(t => t.status === 'on_hold').length,
      'Delayed': filteredTasks.filter(t => t.status === 'delayed').length,
    };
    
    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredTasks]);

  // Tasks by lead chart data
  const leadChartData = useMemo(() => {
    return users.map(user => {
      const userTasks = filteredTasks.filter(t => t.lead_user_id === user.id);
      const completed = userTasks.filter(t => t.status === 'completed').length;
      const open = userTasks.filter(t => t.status !== 'completed').length;
      
      return {
        name: user.full_name?.split(' ')[0] || 'Unknown',
        completed,
        open,
        total: userTasks.length
      };
    }).filter(d => d.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [filteredTasks, users]);

  // Priority distribution
  const priorityChartData = useMemo(() => {
    const priorities = {
      'Urgent': filteredTasks.filter(t => t.priority === 'urgent').length,
      'High': filteredTasks.filter(t => t.priority === 'high').length,
      'Medium': filteredTasks.filter(t => t.priority === 'medium').length,
      'Low': filteredTasks.filter(t => t.priority === 'low').length,
    };
    
    return Object.entries(priorities)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredTasks]);

  // Top delayed tasks
  const topDelayed = useMemo(() => {
    return filteredTasks
      .filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);
  }, [filteredTasks]);

  const handleExport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange,
      metrics,
      tasksByStatus: statusChartData,
      tasksByLead: leadChartData,
      delayedTasks: topDelayed.map(t => ({
        title: t.pillar,
        dueDate: t.due_date,
        status: t.status,
        lead: users.find(u => u.id === t.lead_user_id)?.full_name
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Analytics and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLead} onValueChange={setSelectedLead}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Leads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ListTodo className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{metrics.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{metrics.completed}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{metrics.inProgress}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{metrics.overdue}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{metrics.avgCompletion}%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{metrics.emailSourced}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">From Email</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Workload by Lead */}
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Workload by Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadChartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                  <Bar dataKey="open" name="Open" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Delayed Tasks */}
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Top Delayed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {topDelayed.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-500 dark:text-slate-400">
                No overdue tasks 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {topDelayed.map(task => {
                  const lead = users.find(u => u.id === task.lead_user_id);
                  return (
                    <div key={task.id} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{task.pillar}</p>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{lead?.full_name || 'Unassigned'}</span>
                        <span className="text-red-600 dark:text-red-400">
                          Due {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={task.completion_percent || 0} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lists and Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentEmailsWidget emails={emails} />
        </div>
        <div className="space-y-6">
          <OverdueTasksList tasks={filteredTasks} users={users} />
          <DueThisWeekList tasks={filteredTasks} users={users} />
        </div>
      </div>
      </div>
  );
}