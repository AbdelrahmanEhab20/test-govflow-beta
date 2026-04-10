import React, { useState } from "react";
import { createComment } from "@/api/tasksApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow } from "date-fns";
import UserAvatar from "../shared/UserAvatar";
import { Badge } from "@/components/ui/badge";

const ACTIVITY_ICONS = {
  status_change: '🔄',
  assignment: '👤',
  due_date_change: '📅',
  priority_change: '🔥',
  created: '✨',
  completed: '✅',
  comment: '💬'
};

export default function CommentsList({ 
  entityType, 
  entityId, 
  comments = [], 
  currentUser,
  users = []
}) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: (data) => createComment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      setNewComment('');
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    
    createCommentMutation.mutate({
      entity_type: entityType,
      entity_id: entityId,
      comment_text: newComment,
      activity_type: 'comment',
      is_system: false
    });
  };

  const getUserById = (userId) => {
    return users.find(u => u.id === userId) || null;
  };

  const getUserByEmail = (email) => {
    if (!email) return null;
    const normalized = String(email).trim().toLowerCase();
    return users.find(u => String(u.email || '').trim().toLowerCase() === normalized) || null;
  };

  const getUserByName = (name) => {
    if (!name) return null;
    const normalized = String(name).trim().toLowerCase();
    return users.find(u => String(u.full_name || '').trim().toLowerCase() === normalized) || null;
  };

  const getCommentAuthor = (comment) => {
    if (comment?.user_id) {
      const byId = users.find((u) => u.id === comment.user_id);
      if (byId) return byId;
    }
    if (comment?.created_by_user_id) {
      const byCreatedById = users.find((u) => u.id === comment.created_by_user_id);
      if (byCreatedById) return byCreatedById;
    }
    if (comment?.created_by) {
      const byEmail = getUserByEmail(comment.created_by);
      if (byEmail) return byEmail;
      const byName = getUserByName(comment.created_by);
      if (byName) return byName;
    }
    if (comment?.user_name) {
      const byUserName = getUserByName(comment.user_name);
      if (byUserName) return byUserName;
    }
    if (comment?.user_avatar_url || comment?.user_email || comment?.user_name) {
      return {
        full_name: comment.user_name || comment.created_by || 'Unknown user',
        email: comment.user_email || comment.created_by || '',
        avatar_url: comment.user_avatar_url || '',
      };
    }
    return null;
  };

  // Separate comments and activity
  const regularComments = comments.filter(c => !c.is_system);
  const activityLog = comments.filter(c => c.is_system);

  return (
    <div className="space-y-6">
      {/* Add comment */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Comments</h3>
        <div className="flex gap-3">
          <UserAvatar user={currentUser} size="sm" showTooltip={false} />
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleSubmit}
                disabled={!newComment.trim() || createCommentMutation.isPending}
                size="sm"
              >
                {createCommentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {regularComments.length > 0 && (
        <div className="space-y-4">
          {regularComments.map((comment) => {
            const author = getCommentAuthor(comment);
            return (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar user={author} size="sm" showTooltip={false} />
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {author?.full_name || comment.user_name || comment.created_by || 'Unknown user'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(comment.created_date || comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                  {comment.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {comment.attachments.map((att, idx) => (
                        <a 
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          {att.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {regularComments.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          No comments yet. Be the first to comment.
        </p>
      )}

      {/* Activity log */}
      {activityLog.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Activity Log</h3>
          <div className="space-y-3">
            {activityLog.map((activity) => {
              const author = getCommentAuthor(activity);
              return (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <span className="text-lg">{ACTIVITY_ICONS[activity.activity_type]}</span>
                  <div className="flex-1">
                    <p className="text-slate-700 dark:text-slate-200">
                      <span className="font-medium">{author?.full_name || activity.created_by}</span>
                      {' '}
                      {activity.comment_text}
                      {activity.old_value && activity.new_value && (
                        <span className="text-slate-500 dark:text-slate-400">
                          {' '}from <Badge variant="outline" className="mx-1">{activity.old_value}</Badge>
                          to <Badge variant="outline" className="mx-1">{activity.new_value}</Badge>
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-slate-400">
                      {format(new Date(activity.created_date || activity.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}