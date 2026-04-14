import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutList, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeamMembersView({ members }) {
  const [viewMode, setViewMode] = useState('grid');

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      if (!apiBase) return url;
      try {
        return new URL(url, apiBase).toString();
      } catch {
        return url;
      }
    }
    return url;
  };

  if (viewMode === 'list') {
    return (
      <div>
        <div className="flex justify-end gap-2 mb-4">
          <Button variant={viewMode === 'grid' ? 'outline' : 'default'} size="sm" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {members.map((member) => (
            <Card
              key={member.id}
              className="p-4 flex items-center gap-4 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Avatar className="w-11 h-11">
                <AvatarImage src={resolveMediaUrl(member.avatar_url || member.avatar || member.photo_url || member.image_url || member.profile_image)} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{member.job_title || "No position set"}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary" className="font-medium">{member.department_name || "Unassigned"}</Badge>
                <p className="text-xs text-slate-600 dark:text-slate-300">{member.email || "No email"}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
          <LayoutGrid className="w-4 h-4" />
        </Button>
        <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
          <LayoutList className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((member) => (
          <Card
            key={member.id}
            className="p-5 flex flex-col gap-4 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-slate-100 dark:ring-slate-700">
                <AvatarImage src={resolveMediaUrl(member.avatar_url || member.avatar || member.photo_url || member.image_url || member.profile_image)} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{member.job_title || "No position set"}</p>
              </div>
            </div>
            <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-700">
              <Badge variant="secondary" className="block w-fit font-medium">{member.department_name || "Unassigned"}</Badge>
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{member.email || "No email"}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{member.mobile_number || "No phone"}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}