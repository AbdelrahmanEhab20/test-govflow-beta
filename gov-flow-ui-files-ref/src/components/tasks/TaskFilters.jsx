import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, X, Filter, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "not_started", label: "Not Started | لم يبدأ" },
  { value: "in_progress", label: "In Progress | قيد التنفيذ" },
  { value: "completed", label: "Completed | مكتمل" },
  { value: "on_hold", label: "On Hold | مؤجل" },
  { value: "delayed", label: "Delayed | متأخر" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function TaskFilters({ 
  filters, 
  onFilterChange, 
  users = [],
  pillars = []
}) {
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== 'all' && key !== 'search'
  ).length + (filters.search ? 1 : 0);

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      priority: 'all',
      lead: 'all',
      pillar: 'all',
      emailSourced: false
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 w-full sm:w-auto">
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, status: value })}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.priority || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, priority: value })}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.lead || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, lead: value })}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Lead" />
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

          {pillars.length > 0 && (
            <Select 
              value={filters.pillar || 'all'} 
              onValueChange={(value) => onFilterChange({ ...filters, pillar: value })}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pillars</SelectItem>
                {pillars.map(pillar => (
                  <SelectItem key={pillar} value={pillar}>
                    {pillar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Active Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filters.emailSourced ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange({ ...filters, emailSourced: !filters.emailSourced })}
          className="gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" />
          Email-sourced only
        </Button>

        {activeFilterCount > 0 && (
          <>
            <Badge variant="secondary" className="px-2 py-1">
              <Filter className="w-3 h-3 mr-1" />
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          </>
        )}
      </div>
    </div>
  );
}