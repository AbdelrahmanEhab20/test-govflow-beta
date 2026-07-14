import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Paperclip, Star, StarOff, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const CATEGORY_COLORS = {
  general: "bg-slate-100 text-slate-700",
  invitation: "bg-purple-100 text-purple-700",
  mou: "bg-blue-100 text-blue-700",
  media: "bg-pink-100 text-pink-700",
  data_request: "bg-amber-100 text-amber-700",
  complaint: "bg-red-100 text-red-700",
  protocol: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-700"
};

const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_INDICATORS = {
  new: "bg-blue-500",
  triaged: "bg-amber-500",
  converted: "bg-emerald-500",
  archived: "bg-slate-400"
};

function resolveAssigneeName(email, users = [], tasks = []) {
  if (email.assigned_to_user_id) {
    const user = users.find((u) => u.id === email.assigned_to_user_id);
    return user?.full_name || user?.email || null;
  }
  if (email.linked_task_id) {
    const task = tasks.find((t) => t.id === email.linked_task_id);
    if (task?.lead_user_name) return task.lead_user_name;
    if (task?.lead_user_id) {
      const user = users.find((u) => u.id === task.lead_user_id);
      return user?.full_name || user?.email || null;
    }
  }
  return null;
}

export default function EmailListItem({ 
  email, 
  users = [],
  tasks = [],
  isSelected, 
  isActive,
  onSelect, 
  onClick,
  onStar 
}) {
  const assigneeName = resolveAssigneeName(email, users, tasks);
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-start gap-3 p-4 border-b border-slate-100 cursor-pointer transition-colors
        ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'}
        ${!email.is_read ? 'bg-slate-50' : ''}
      `}
    >
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onStar();
          }}
          className="text-slate-300 hover:text-amber-400"
        >
          {email.is_starred ? (
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          ) : (
            <StarOff className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_INDICATORS[email.status_in_system]}`} />
            <span className={`truncate ${!email.is_read ? 'font-semibold' : ''}`}>
              {email.from_name || email.from_email}
            </span>
          </div>
          <span className="text-xs text-slate-400 shrink-0">
            {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
          </span>
        </div>

        <p className={`text-sm truncate mt-0.5 ${!email.is_read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
          {email.subject}
        </p>

        <p className="text-xs text-slate-500 truncate mt-0.5">
          {email.body_preview}
        </p>

        <div className="flex items-center gap-2 mt-2">
          {email.has_attachments && (
            <Paperclip className="w-3 h-3 text-slate-400" />
          )}
          {email.category && email.category !== 'general' && (
            <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${CATEGORY_COLORS[email.category]}`}>
              {email.category.replace('_', ' ')}
            </Badge>
          )}
          {email.suggested_priority && (
            <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${PRIORITY_COLORS[email.suggested_priority] || PRIORITY_COLORS.medium}`}>
              {email.suggested_priority}
            </Badge>
          )}
          {Array.isArray(email.tags) && email.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {email.linked_task_id && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-emerald-100 text-emerald-700 max-w-full truncate">
              <UserIcon className="w-3 h-3 mr-0.5 shrink-0" />
              {assigneeName ? `Assigned to ${assigneeName}` : 'Linked to task'}
            </Badge>
          )}
          {!email.linked_task_id && email.assigned_to_user_id && assigneeName && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-amber-100 text-amber-800 max-w-full truncate">
              <UserIcon className="w-3 h-3 mr-0.5 shrink-0" />
              Assigned to {assigneeName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}