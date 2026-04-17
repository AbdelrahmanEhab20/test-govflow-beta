import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Grid3X3,
  Plus,
  X,
  Calendar,
  Mail,
  ListTodo,
  BarChart3,
  TrendingUp,
  Users,
  SlidersHorizontal,
  GripVertical,
  Expand,
  Link2,
  Check,
} from "lucide-react";
import { listTasks } from "@/api/tasksApi";
import { listEmails } from "@/api/emailApi";
import { listUsers } from "@/api/usersApi";
import { listWorkflowStages } from "@/api/workflowApi";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { getKanbanStageCounts } from "@/lib/taskAggregation";

const AVAILABLE_WIDGETS = [
  { id: "taskSummary", title: "Task Summary", description: "Overview of your tasks by status", icon: ListTodo },
  { id: "upcomingDeadlines", title: "Upcoming Deadlines", description: "Tasks due soon, sorted by urgency", icon: Calendar },
  { id: "recentEmails", title: "Recent Emails", description: "Latest emails in your inbox", icon: Mail },
  { id: "myProgress", title: "My Progress", description: "Your personal task completion stats", icon: TrendingUp },
  { id: "teamActivity", title: "Team Activity", description: "Latest team updates", icon: Users },
  { id: "quickLinks", title: "Quick Links", description: "Fast navigation shortcuts", icon: Grid3X3 },
];

const DEFAULT_WIDGETS = ["teamActivity", "quickLinks"];

const DEFAULT_QUICK_LINKS = [
  { label: "Tasks", page: "Tasks", category: "blue" },
  { label: "Email Inbox", page: "EmailInbox", category: "purple" },
  { label: "Reports", page: "Reports", category: "green" },
  { label: "Team", page: "Team", category: "indigo" },
  { label: "Calendar", page: "CalendarView", category: "amber" },
];

const CATEGORY_CLASSES = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

const QUICK_LINK_PAGE_ICON = {
  Tasks: ListTodo,
  EmailInbox: Mail,
  Reports: BarChart3,
  Team: Users,
  CalendarView: Calendar,
  MyDashboard: Grid3X3,
};

const STAGE_CARD_CLASSES = {
  blue: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
  green: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200",
  yellow: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200",
  red: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
  purple: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-200",
  slate: "bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100",
};

function moveItem(list, fromIndex, toIndex) {
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

function WidgetShell({ id, title, onRemove, editing, children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none ${className}`}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2 min-w-0">
          {editing ? <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" /> : null}
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate text-[15px]">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center justify-center"
            type="button"
            aria-label={`Expand ${title}`}
          >
            <Expand className="w-3.5 h-3.5" />
          </button>
          {editing && onRemove ? (
            <button
              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400"
              onClick={() => onRemove(id)}
              type="button"
              aria-label={`Remove ${title} widget`}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function MyDashboard() {
  const { user } = useAuth();
  const storageKey = `govflow_dashboard_state_${user?.id || "anon"}`;
  const [editing, setEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [widgets, setWidgets] = useState(() => DEFAULT_WIDGETS);
  const [quickLinks, setQuickLinks] = useState(() => DEFAULT_QUICK_LINKS);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkPage, setNewLinkPage] = useState("Tasks");
  const [newLinkCategory, setNewLinkCategory] = useState("slate");
  const [showAddLinkRow, setShowAddLinkRow] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ["dashboardTasks"],
    queryFn: () => listTasks({ orderBy: "-created_date", limit: 200 }),
  });

  const { data: emails = [] } = useQuery({
    queryKey: ["dashboardEmails"],
    queryFn: () => listEmails({}, "-received_at", 20),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["dashboardUsers"],
    queryFn: () => listUsers(),
  });

  const { data: workflowStages = [] } = useQuery({
    queryKey: ["dashboardWorkflowStages"],
    queryFn: () => listWorkflowStages({ is_active: true }, "order"),
  });

  const stageSummary = useMemo(() => {
    return getKanbanStageCounts(tasks, workflowStages);
  }, [tasks, workflowStages]);

  const userNameById = useMemo(() => {
    const map = new Map();
    for (const u of users) {
      if (u?.id) map.set(u.id, u.full_name || u.email || "Unknown user");
    }
    return map;
  }, [users]);

  const myTasks = useMemo(() => {
    if (!user?.id) return [];
    return tasks.filter((task) => task.lead_user_id === user.id);
  }, [tasks, user?.id]);

  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    return myTasks
      .filter((task) => task.due_date && task.status !== "completed")
      .map((task) => ({ ...task, dueTs: new Date(task.due_date).getTime() }))
      .filter((task) => Number.isFinite(task.dueTs) && task.dueTs >= now && task.dueTs <= now + twoWeeksMs)
      .sort((a, b) => a.dueTs - b.dueTs)
      .slice(0, 5);
  }, [myTasks]);

  const recentTeamActivity = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0))
      .slice(0, 6);
  }, [tasks]);

  const myProgress = useMemo(() => {
    const total = myTasks.length;
    const completed = myTasks.filter((task) => task.status === "completed").length;
    const active = myTasks.filter((task) => task.status === "in_progress").length;
    const overdue = myTasks.filter((task) => {
      if (!task.due_date || task.status === "completed") return false;
      return new Date(task.due_date).getTime() < Date.now();
    }).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, overdue, completionRate };
  }, [myTasks]);

  const formatDueLabel = (dueDate) => {
    if (!dueDate) return "No due date";
    const due = new Date(dueDate).getTime();
    if (!Number.isFinite(due)) return "No due date";
    const diffDays = Math.ceil((due - Date.now()) / (24 * 60 * 60 * 1000));
    if (diffDays <= 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.widgets)) setWidgets(parsed.widgets);
      if (Array.isArray(parsed.quickLinks)) setQuickLinks(parsed.quickLinks);
    } catch {
      // Ignore invalid local state.
    }
  }, [storageKey, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(storageKey, JSON.stringify({ widgets, quickLinks }));
  }, [storageKey, user?.id, widgets, quickLinks]);

  const addWidget = (id) => {
    setWidgets((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setShowAddWidget(false);
  };

  const removeWidget = (id) => {
    setWidgets((prev) => prev.filter((x) => x !== id));
  };

  const handleAddQuickLink = () => {
    const label = newLinkLabel.trim();
    if (!label) return;
    setQuickLinks((prev) => [
      ...prev,
      { label, page: newLinkPage, category: newLinkCategory },
    ]);
    setNewLinkLabel("");
    setNewLinkPage("Tasks");
    setNewLinkCategory("slate");
    setShowAddLinkRow(false);
  };

  const handleRemoveQuickLink = (index) => {
    setQuickLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWidgetDragEnd = (result) => {
    if (!result.destination || !editing) return;
    setWidgets((prev) => moveItem(prev, result.source.index, result.destination.index));
  };

  const renderWidget = (widgetId) => {
    if (widgetId === "taskSummary") {
      return (
        <WidgetShell id={widgetId} title="Task Summary" editing={editing} onRemove={removeWidget} className="min-h-[220px]">
          <div className="grid grid-cols-2 gap-2.5">
            {workflowStages.map((stage) => (
              <div
                key={stage.id}
                className={`rounded-xl border p-3 ${STAGE_CARD_CLASSES[stage.color] || STAGE_CARD_CLASSES.slate}`}
              >
                <div className="text-[30px] leading-none font-bold">
                  {stageSummary.countsByStageId[stage.id] || 0}
                </div>
                <div className="text-xs mt-1.5 opacity-90">{stage.name}</div>
              </div>
            ))}
            <div className={`rounded-xl border p-3 ${STAGE_CARD_CLASSES.slate}`}>
              <div className="text-[30px] leading-none font-bold">
                {stageSummary.backlog}
              </div>
              <div className="text-xs mt-1.5 opacity-90">Backlog</div>
            </div>
          </div>
        </WidgetShell>
      );
    }

    if (widgetId === "upcomingDeadlines") {
      return (
        <WidgetShell id={widgetId} title="Upcoming Deadlines" editing={editing} onRemove={removeWidget} className="min-h-[180px]">
          {upcomingDeadlines.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400">No upcoming deadlines 🎉</div>
          ) : (
            <div className="space-y-2.5">
              {upcomingDeadlines.map((task) => (
                <Link
                  key={task.id}
                  to={createPageUrl(`TaskDetail?id=${task.id}`)}
                  className="block rounded-lg border border-slate-100 dark:border-slate-700 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{task.pillar}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDueLabel(task.due_date)}</div>
                </Link>
              ))}
            </div>
          )}
        </WidgetShell>
      );
    }

    if (widgetId === "recentEmails") {
      return (
        <WidgetShell id={widgetId} title="Recent Emails" editing={editing} onRemove={removeWidget} className="min-h-[220px]">
          <div className="space-y-2">
            {emails.slice(0, 4).map((email) => (
              <Link key={email.id} to={createPageUrl(`EmailInbox?id=${email.id}`)} className="block rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="font-medium text-slate-800 dark:text-slate-100 truncate">{email.subject}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{email.from_email}</div>
              </Link>
            ))}
          </div>
        </WidgetShell>
      );
    }

    if (widgetId === "myProgress") {
      return (
        <WidgetShell id={widgetId} title="My Progress" editing={editing} onRemove={removeWidget} className="min-h-[180px]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-xl font-semibold text-slate-900 dark:text-white">{myProgress.total}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Assigned</div>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2.5">
              <div className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">{myProgress.completed}</div>
              <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Done</div>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2.5">
              <div className="text-xl font-semibold text-blue-700 dark:text-blue-300">{myProgress.active}</div>
              <div className="text-xs text-blue-700/80 dark:text-blue-300/80">Active</div>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2.5">
              <div className="text-xl font-semibold text-red-700 dark:text-red-300">{myProgress.overdue}</div>
              <div className="text-xs text-red-700/80 dark:text-red-300/80">Overdue</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Completion</span>
              <span>{myProgress.completionRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${myProgress.completionRate}%` }} />
            </div>
          </div>
        </WidgetShell>
      );
    }

    if (widgetId === "teamActivity") {
      return (
        <WidgetShell id={widgetId} title="Team Activity" editing={editing} onRemove={removeWidget} className="min-h-[180px]">
          {recentTeamActivity.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400">No recent activity</div>
          ) : (
            <div className="space-y-2">
              {recentTeamActivity.map((task) => (
                <Link
                  key={task.id}
                  to={createPageUrl(`TaskDetail?id=${task.id}`)}
                  className="block rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{task.pillar}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {userNameById.get(task.lead_user_id) || "Unassigned"} · {task.status?.replace("_", " ") || "unknown"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </WidgetShell>
      );
    }

    if (widgetId === "quickLinks") {
      return (
        <WidgetShell id={widgetId} title="Quick Links" editing={editing} onRemove={removeWidget} className="min-h-[180px]">
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((item, index) => (
              <div key={`${item.label}-${index}`} className="relative group">
                {(() => {
                  const QuickIcon = QUICK_LINK_PAGE_ICON[item.page] || Link2;
                  return (
                    <Link
                      to={createPageUrl(item.page)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium block ${CATEGORY_CLASSES[item.category] || CATEGORY_CLASSES.slate}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <QuickIcon className="w-3.5 h-3.5" />
                        {item.label}
                      </span>
                    </Link>
                  );
                })()}
                {editing ? (
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveQuickLink(index)}
                    aria-label={`Remove ${item.label} link`}
                  >
                    <X className="w-3 h-3 mx-auto" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {editing && showAddLinkRow ? (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Link label"
                  className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100"
                />
                <select
                  value={newLinkPage}
                  onChange={(e) => setNewLinkPage(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 px-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="Tasks">Tasks</option>
                  <option value="EmailInbox">Email Inbox</option>
                  <option value="Reports">Reports</option>
                  <option value="Team">Team</option>
                  <option value="CalendarView">Calendar</option>
                  <option value="MyDashboard">My Dashboard</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newLinkCategory}
                  onChange={(e) => setNewLinkCategory(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 px-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="slate">Default</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                  <option value="indigo">Indigo</option>
                  <option value="amber">Amber</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddQuickLink}
                  className="h-9 px-3 rounded-lg bg-blue-600 text-white text-sm inline-flex items-center"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewLinkLabel("");
                    setShowAddLinkRow(false);
                  }}
                  className="h-9 px-3 rounded-lg text-sm text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="mt-3 text-center text-sm text-slate-400 dark:text-slate-500 w-full inline-flex items-center justify-center"
              onClick={() => setShowAddLinkRow(true)}
            >
              <Link2 className="w-3.5 h-3.5 mr-1" />
              Add Link
            </button>
          )}
        </WidgetShell>
      );
    }

    return null;
  };

  return (
    <div className="p-4 sm:p-5 lg:p-8 space-y-5 bg-slate-50 dark:bg-slate-950 min-h-full">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            My Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-300 mt-0.5 text-sm sm:text-[15px] truncate">
            Welcome back, {user?.full_name || "user"}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
          <Button
            variant={editing ? "default" : "outline"}
            className="h-10 px-3 sm:px-4 text-[14px] col-span-1"
            onClick={() => setEditing((v) => !v)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{editing ? "Done Editing" : "Customize"}</span>
            <span className="sm:hidden">{editing ? "Done" : "Edit"}</span>
          </Button>
          <Button className="h-10 px-3 sm:px-4 text-[14px] col-span-1" onClick={() => setShowAddWidget(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Add Widget</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30 rounded-xl px-4 py-3 text-sm">
          Edit mode: drag widgets to reorder, remove with X, and update quick links.
        </div>
      ) : null}

      <DragDropContext onDragEnd={handleWidgetDragEnd}>
        <Droppable droppableId="dashboard-widgets" direction="horizontal">
          {(provided) => (
            <div
              className="grid grid-cols-1 xl:grid-cols-2 gap-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {widgets.map((widgetId, index) => (
                <Draggable
                  key={widgetId}
                  draggableId={widgetId}
                  index={index}
                  isDragDisabled={!editing}
                >
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={editing ? "cursor-grab active:cursor-grabbing" : ""}
                    >
                      {renderWidget(widgetId)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showAddWidget && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 bg-black/45 backdrop-blur-[1px] z-[70] flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl leading-none font-semibold text-slate-900 dark:text-slate-100">Add Widget</h2>
                  <button onClick={() => setShowAddWidget(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" type="button">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {AVAILABLE_WIDGETS.filter((w) => !widgets.includes(w.id)).map((w) => {
                    const Icon = w.icon;
                    return (
                      <div key={w.id} className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{w.title}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{w.description}</div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => addWidget(w.id)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    );
                  })}
                  {!AVAILABLE_WIDGETS.some((w) => !widgets.includes(w.id)) ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400 py-3">All widgets are already added.</div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

