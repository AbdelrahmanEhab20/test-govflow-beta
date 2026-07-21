import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { getCurrentUser } from '@/api/authApi';
import { listTasks, updateTask } from '@/api/tasksApi';
import { listUsers } from '@/api/usersApi';
import { listWorkflowStages, updateWorkflowStage, bulkCreateWorkflowStages } from '@/api/workflowApi';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Loader2, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import KanbanColumn from '../components/kanban/KanbanColumn';
import KanbanTaskCard from '../components/kanban/KanbanTaskCard';
import KanbanFilters from '../components/kanban/KanbanFilters';
import TaskListForBacklog from '../components/kanban/TaskListForBacklog';
import { ROLES } from '../components/shared/rbac';
import { buildTaskStatusPatch } from '@/lib/taskAggregation';

export default function KanbanBoard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    assignee: '',
    priority: '',
    myTasks: false
  });
  const [expandedFilters, setExpandedFilters] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks(),
  });

  const { data: workflowStages = [] } = useQuery({
    queryKey: ['workflowStages'],
    queryFn: () => listWorkflowStages({ is_active: true }, 'order'),
  });

  // Auto-update "Backlog" to "Pipeline" if exists
  useEffect(() => {
    const backlogStage = workflowStages.find(s => s.name === 'Backlog');
    if (backlogStage) {
      updateWorkflowStage(backlogStage.id, {
        name: 'Pipeline',
        description: 'Tasks in the pipeline'
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
      });
    }
  }, [workflowStages, queryClient]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error(error?.message || 'Unable to move task.');
    },
  });

  const createDemoWorkflowsMutation = useMutation({
    mutationFn: async () => {
      const demoStages = [
        {
          name: 'Pipeline',
          description: 'Tasks in the pipeline',
          order: 0,
          color: 'blue',
          is_active: true,
          require_approval: false,
          allowed_transitions: []
        },
        {
          name: 'In Progress',
          description: 'Currently being worked on',
          order: 1,
          color: 'yellow',
          is_active: true,
          require_approval: false,
          allowed_transitions: []
        },
        {
          name: 'In Review',
          description: 'Awaiting review and approval',
          order: 2,
          color: 'purple',
          is_active: true,
          require_approval: true,
          allowed_transitions: []
        },
        {
          name: 'Completed',
          description: 'Tasks successfully completed',
          order: 3,
          color: 'green',
          is_active: true,
          require_approval: false,
          allowed_transitions: []
        },
        {
          name: 'Approved',
          description: 'Tasks approved and finalized',
          order: 4,
          color: 'indigo',
          is_active: true,
          require_approval: false,
          allowed_transitions: []
        }
      ];
      return bulkCreateWorkflowStages(demoStages);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
    },
  });

  const canDragTask = (task) => {
    // Department admins and managers can drag all tasks
    if ([ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER].includes(user?.role)) {
      return true;
    }
    // Team members/users can only drag their own tasks
    if ([ROLES.TEAM_MEMBER, ROLES.USER].includes(user?.role)) {
      return task.lead_user_id === user?.id;
    }
    return false;
  };

  const canMarkDone = () => {
    return [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.EDITOR].includes(user?.role);
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Extract task ID from draggableId (handles both formats: direct ID and "backlog-task-{id}")
    const taskId = draggableId.startsWith('backlog-task-') 
      ? draggableId.replace('backlog-task-', '') 
      : draggableId;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || !canDragTask(task)) return;

    const targetStageId = destination.droppableId;
    const targetStage = workflowStages.find((s) => s.id === targetStageId);
    const targetStageName = String(targetStage?.name || '').toLowerCase();

    if (!canMarkDone() && (targetStageName === 'completed' || targetStageName === 'approved' || targetStageName === 'done')) {
      toast.error('Only managers/admins can move tasks to completed.');
      return;
    }

    const patch = buildTaskStatusPatch(
      {
        workflow_stage_id: targetStageId,
        last_activity_at: new Date().toISOString(),
      },
      task,
      workflowStages
    );

    updateTaskMutation.mutate({
      taskId,
      data: patch,
    });
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery && !task.pillar.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // My tasks filter
      if (filters.myTasks && task.lead_user_id !== user?.id) {
        return false;
      }

      // Assignee filter
      if (filters.assignee && task.lead_user_id !== filters.assignee) {
        return false;
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      return true;
    });
  };

  const getTasksByStage = (stageId) => {
    return getFilteredTasks().filter(task => task.workflow_stage_id === stageId);
  };

  const getBacklogTasks = () => {
    return getFilteredTasks().filter(task => !task.workflow_stage_id);
  };

  const getUserName = (userId) => {
    const u = users.find(user => user.id === userId);
    return u?.full_name || 'Unassigned';
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({ assignee: '', priority: '', myTasks: false });
  };

  const activeFiltersCount = (filters.assignee ? 1 : 0) + (filters.priority ? 1 : 0) + (filters.myTasks ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Task Board</h1>
            {(user?.role === ROLES.ADMIN || user?.role === ROLES.DEPARTMENT_ADMIN) && (
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('WorkflowStageManagement'))}
                className="dark:border-slate-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure Board
              </Button>
            )}
          </div>
          
          {/* Search and Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-64 isolate">
              <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setExpandedFilters(!expandedFilters)}
              className="dark:border-slate-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-blue-600">{activeFiltersCount}</Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Expanded Filters */}
          {expandedFilters && (
            <div className="mt-4">
              <KanbanFilters
                filters={filters}
                onFiltersChange={setFilters}
                users={users}
              />
            </div>
          )}
        </div>

        {/* Drag Context Wrapper */}
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Kanban Board */}
          {workflowStages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              {workflowStages.map(stage => (
               <Droppable key={stage.id} droppableId={stage.id} type="TASK">
                 {(provided, snapshot) => (
                   <KanbanColumn
                     stage={stage}
                     tasks={getTasksByStage(stage.id)}
                     users={users}
                     provided={provided}
                     snapshot={snapshot}
                     getUserName={getUserName}
                     canDragTask={canDragTask}
                     currentUser={user}
                   />
                 )}
               </Droppable>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center dark:bg-slate-900 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              No workflow stages configured. Create workflow stages to use the Kanban board.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate(createPageUrl('Settings'))}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Configure Workflow Stages
              </Button>
              <Button
                onClick={() => createDemoWorkflowsMutation.mutate()}
                disabled={createDemoWorkflowsMutation.isPending}
                variant="outline"
              >
                {createDemoWorkflowsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Demo Workflows
              </Button>
            </div>
          </Card>
          )}

          {/* Backlog - Tasks List (Below Board) */}
          {workflowStages.length > 0 && getBacklogTasks().length > 0 && (
            <div className="mt-8">
              <TaskListForBacklog
                tasks={getBacklogTasks()}
                getUserName={getUserName}
                canDragTask={canDragTask}
                currentUser={user}
              />
            </div>
          )}
        </DragDropContext>
      </div>
    </div>
  );
}