import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/authApi";
import { getTaskById, deleteTask, listSubtasks, listComments } from "@/api/tasksApi";
import { listUsers } from "@/api/usersApi";
import { getEmailById } from "@/api/emailApi";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  User,
  Mail,
  ExternalLink,
  Clock,
  Flag,
  FileText,
  Loader2,
  Paperclip } from
"lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger } from
"@/components/ui/alert-dialog";

import StatusBadge from "../components/shared/StatusBadge";
import PriorityBadge from "../components/shared/PriorityBadge";
import ProgressBar from "../components/shared/ProgressBar";
import UserAvatar from "../components/shared/UserAvatar";
import SubtaskList from "../components/tasks/SubtaskList";
import CommentsList from "../components/tasks/CommentsList";
import { ROLES } from "@/components/shared/rbac";

function formatAttachmentSize(bytes) {
  const n = Number(bytes);
  if (!n || Number.isNaN(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser()
  });

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTaskById(taskId),
    enabled: !!taskId
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers()
  });

  const { data: subtasks = [] } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => listSubtasks(taskId),
    enabled: !!taskId
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', 'task', taskId],
    queryFn: () => listComments('task', taskId),
    enabled: !!taskId
  });

  const { data: linkedEmail } = useQuery({
    queryKey: ['email', task?.source_email_id],
    queryFn: () => getEmailById(task.source_email_id),
    enabled: !!task?.source_email_id
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate(createPageUrl('Tasks'));
    }
  });

  const leadUser = users.find((u) => u.id === task?.lead_user_id);
  const email = linkedEmail ?? null;
  const isHigherRole = [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.EDITOR].includes(currentUser?.role);
  const isOwnTask = task?.lead_user_id === currentUser?.id;
  // Keep task content edits to manager/editor roles only.
  const canEditTask = isHigherRole || (currentUser?.role === ROLES.TEAM_MEMBER && isOwnTask);
  const canDeleteTask = isHigherRole;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>);

  }

  if (!task) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900">Task not found</h2>
          <p className="text-slate-500 mt-2">The task you're looking for doesn't exist.</p>
          <Link to={createPageUrl('Tasks')}>
            <Button className="mt-4">Back to Tasks</Button>
          </Link>
        </div>
      </div>);

  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-slate-600 text-2xl font-bold">{task.pillar}</h1>
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
              {task.source_email_id &&
              <div className="flex items-center gap-1 mt-2 text-sm text-purple-600">
                  <Mail className="w-4 h-4" />
                  Created from email
                </div>
              }
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEditTask && (
              <Link to={createPageUrl(`TaskForm?id=${taskId}`)}>
                <Button variant="outline">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            {canDeleteTask && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                {task.brief_description ?
                <p className="text-slate-700 whitespace-pre-wrap">{task.brief_description}</p> :

                <p className="text-slate-400 italic">No description provided</p>
                }
              </CardContent>
            </Card>

            {/* Deliverables */}
            {task.deliverables &&
            <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deliverables</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{task.deliverables}</p>
                </CardContent>
              </Card>
            }

            {/* Linked Email */}
            {email &&
            <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-500" />
                    Linked Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          From: {email.from_name || email.from_email}
                        </p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(email.received_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Link to={createPageUrl(`EmailInbox?id=${email.id}`)}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                    {(email.has_attachments || (email.attachments && email.attachments.length > 0)) && (
                      <div className="mt-4 pt-4 border-t border-purple-100">
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-purple-600" />
                          Attachments
                        </p>
                        {email.attachments && email.attachments.length > 0 ? (
                          <ul className="mt-2 space-y-2">
                            {email.attachments.map((att, idx) => (
                              <li
                                key={att.id || `${att.name}-${idx}`}
                                className="flex items-start justify-between gap-3 text-sm text-slate-700 bg-white/80 rounded-md px-3 py-2 border border-purple-100"
                              >
                                <span className="font-medium truncate" title={att.name}>
                                  {att.name || 'File'}
                                </span>
                                <span className="text-xs text-slate-500 shrink-0">
                                  {att.contentType ? `${att.contentType} · ` : ''}
                                  {formatAttachmentSize(att.size)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600 mt-2">
                            This email includes attachments. Open the message in Email Inbox and run Refresh to sync attachment details.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            }

            {/* Subtasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <SubtaskList
                  taskId={taskId}
                  subtasks={subtasks}
                  users={users} />

              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardContent className="pt-6">
                <CommentsList
                  entityType="task"
                  entityId={taskId}
                  comments={comments}
                  currentUser={currentUser}
                  users={users} />

              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ProgressBar value={task.completion_percent || 0} />
                  <div className="text-center">
                    <span className="text-3xl font-bold text-slate-900">
                      {task.completion_percent || 0}%
                    </span>
                    <p className="text-sm text-slate-500">Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lead */}
                <div>
                  <p className="text-sm text-slate-500 mb-1">Lead Owner</p>
                  {leadUser ?
                  <div className="flex items-center gap-2">
                      <UserAvatar user={leadUser} size="sm" showTooltip={false} />
                      <span className="font-medium">{leadUser.full_name}</span>
                    </div> :

                  <span className="text-slate-400">Unassigned</span>
                  }
                </div>

                <Separator />

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Start Date</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {task.start_date ?
                        format(new Date(task.start_date), 'MMM d, yyyy') :
                        'Not set'
                        }
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Due Date</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className={
                      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' ?
                      'text-red-600 font-medium' :
                      ''
                      }>
                        {task.due_date ?
                        format(new Date(task.due_date), 'MMM d, yyyy') :
                        'Not set'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stakeholders */}
                {task.stakeholders?.length > 0 &&
                <>
                    <div>
                      <p className="text-sm text-slate-500 mb-2">Stakeholders</p>
                      <div className="flex flex-wrap gap-1">
                        {task.stakeholders.map((s) =>
                      <Badge key={s} variant="secondary">{s}</Badge>
                      )}
                      </div>
                    </div>
                    <Separator />
                  </>
                }

                {/* Dependencies */}
                {task.dependencies &&
                <>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Dependencies</p>
                      <p className="text-sm">{task.dependencies}</p>
                    </div>
                    <Separator />
                  </>
                }

                {/* Tags */}
                {task.tags?.length > 0 &&
                <div>
                    <p className="text-sm text-slate-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) =>
                    <Badge key={tag} variant="outline">{tag}</Badge>
                    )}
                    </div>
                  </div>
                }

                {/* Notes */}
                {task.notes &&
                <>
                    <Separator />
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                    </div>
                  </>
                }
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-slate-500">
                  <p>Created: {format(new Date(task.created_date), 'MMM d, yyyy h:mm a')}</p>
                  {task.updated_date &&
                  <p>Updated: {format(new Date(task.updated_date), 'MMM d, yyyy h:mm a')}</p>
                  }
                  {task.created_by && <p>By: {task.created_by}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>);

}