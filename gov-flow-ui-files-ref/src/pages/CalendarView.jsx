import React, { useState, useMemo } from "react";
import { listTasks } from "@/api/tasksApi";
import { listUsers } from "@/api/usersApi";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  List,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO
} from "date-fns";
import StatusBadge from "../components/shared/StatusBadge";
import PriorityBadge from "../components/shared/PriorityBadge";
import CalendarFilters from "../components/calendar/CalendarFilters";
import CalendarWeekView from "../components/calendar/CalendarWeekView";
import CalendarDayView from "../components/calendar/CalendarDayView";
import QuickTaskDialog from "../components/calendar/QuickTaskDialog";

const PRIORITY_COLORS = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-slate-400"
};

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickTaskDate, setQuickTaskDate] = useState(null);
  const [filters, setFilters] = useState({ assignee: null, status: null });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks({ orderBy: '-due_date' }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Filter tasks based on assignee and status
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.assignee && task.lead_user_id !== filters.assignee) return false;
      if (filters.status && task.status !== filters.status) return false;
      return true;
    });
  }, [tasks, filters]);

  // Group filtered tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = {};
    filteredTasks.forEach(task => {
      if (task.due_date) {
        const dateKey = task.due_date.split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [filteredTasks]);

  // Get tasks for selected date
  const selectedDateTasks = selectedDate 
    ? tasksByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const navigatePrev = () => setCurrentMonth(subMonths(currentMonth, 1));
  const navigateNext = () => setCurrentMonth(addMonths(currentMonth, 1));
  const navigateToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || 'Unassigned';
  };

  const handleQuickCreate = (date) => {
    setQuickTaskDate(date);
    setQuickTaskOpen(true);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Calendar</h1>
            <p className="text-slate-500 dark:text-slate-300 mt-1">View tasks by due date</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigateToday} className="shrink-0">
              Today
            </Button>
            <div className="flex items-center border rounded-lg min-w-0 flex-1 sm:flex-none">
              <Button variant="ghost" size="icon" onClick={navigatePrev} className="shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 sm:px-4 font-medium min-w-0 sm:min-w-[140px] text-center flex-1 text-sm sm:text-base truncate">
                {format(view === 'month' ? currentMonth : selectedDate || currentMonth, view === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
              </span>
              <Button variant="ghost" size="icon" onClick={navigateNext} className="shrink-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center border rounded-lg">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setView('month')}
                title="Month view"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setView('week')}
                title="Week view"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setView('day')}
                title="Day view"
              >
                <CalendarIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <CalendarFilters users={users} filters={filters} onFilterChange={setFilters} />
      </div>

      {view === 'month' && (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-700 border-b dark:border-slate-600">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[84px] sm:min-h-[100px] p-1.5 sm:p-2 border-b border-r dark:border-slate-600 cursor-pointer transition-colors
                      ${!isCurrentMonth ? 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-inset' : ''}
                    `}
                  >
                    <div className={`
                      w-7 h-7 flex items-center justify-center rounded-full mb-1
                      ${isCurrentDay ? 'bg-blue-600 text-white' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                       {dayTasks.slice(0, 3).map(task => (
                         <Link
                           key={task.id}
                           to={createPageUrl(`TaskDetail?id=${task.id}`)}
                           onClick={(e) => e.stopPropagation()}
                           className={`
                             block px-1.5 py-0.5 rounded text-xs truncate
                             ${task.status === 'completed' 
                               ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 line-through' 
                               : `${PRIORITY_COLORS[task.priority]} text-white`
                             }
                           `}
                         >
                           {task.pillar}
                         </Link>
                       ))}
                       {dayTasks.length > 3 && (
                         <span className="text-xs text-slate-500 dark:text-slate-400 px-1.5">
                           +{dayTasks.length - 3} more
                         </span>
                       )}
                     </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar - Selected Date Tasks */}
        <div className="lg:col-span-1">
          <Card className="p-4 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              {selectedDate 
                ? format(selectedDate, 'EEEE, MMMM d') 
                : 'Select a date'
              }
            </h3>

            {!selectedDate ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Click on a date to view tasks
              </p>
            ) : selectedDateTasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No tasks due on this date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map(task => (
                   <Link
                     key={task.id}
                     to={createPageUrl(`TaskDetail?id=${task.id}`)}
                     className="block p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                   >
                     <div className="flex items-start justify-between gap-2">
                       <p className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2">
                         {task.pillar}
                       </p>
                       <PriorityBadge priority={task.priority} size="sm" showIcon={false} />
                     </div>
                     <div className="mt-2 flex items-center gap-2">
                       <StatusBadge status={task.status} size="sm" />
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                       {getUserName(task.lead_user_id)}
                     </p>
                   </Link>
                 ))}
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t dark:border-slate-600">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Priority Legend</p>
              <div className="space-y-1">
                {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
                  <div key={priority} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${color}`} />
                    <span className="text-xs text-slate-600 dark:text-slate-300 capitalize">{priority}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}

      {view === 'week' && (
        <CalendarWeekView
          currentDate={selectedDate || currentMonth}
          tasksByDate={tasksByDate}
          onDateSelect={setSelectedDate}
          onCreateTask={handleQuickCreate}
        />
      )}

      {view === 'day' && selectedDate && (
        <CalendarDayView
          selectedDate={selectedDate}
          tasksByDate={tasksByDate}
          users={users}
          onCreateTask={handleQuickCreate}
        />
      )}

      {view === 'day' && !selectedDate && (
        <Card className="p-8 text-center dark:bg-slate-800 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">Select a date from the month view to see day details</p>
        </Card>
      )}

      <QuickTaskDialog
        isOpen={quickTaskOpen}
        onOpenChange={setQuickTaskOpen}
        selectedDate={quickTaskDate || new Date()}
        users={users}
      />
    </div>
  );
}