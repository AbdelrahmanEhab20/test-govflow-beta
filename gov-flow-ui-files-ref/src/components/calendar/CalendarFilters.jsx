import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CalendarFilters({ users, filters, onFilterChange, hideAssigneeFilter = false }) {
  const hasActiveFilters = (!hideAssigneeFilter && filters.assignee) || filters.status;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {!hideAssigneeFilter && (
      <Select value={filters.assignee || ""} onValueChange={(value) => onFilterChange({ ...filters, assignee: value || null })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All Assignees</SelectItem>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id}>
              {user.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      )}

      <Select value={filters.status || ""} onValueChange={(value) => onFilterChange({ ...filters, status: value || null })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All Status</SelectItem>
          <SelectItem value="not_started">Not Started</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="on_hold">On Hold</SelectItem>
          <SelectItem value="delayed">Delayed</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange({ assignee: null, status: null })}
          className="text-slate-500 hover:text-slate-700"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}