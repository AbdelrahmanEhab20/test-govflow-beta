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
        <div className="space-y-2">
          {members.map((member) => (
            <Card key={member.id} className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <Avatar className="w-10 h-10">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{member.job_title}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary">{member.department_name}</Badge>
                <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card key={member.id} className="p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{member.job_title}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="block w-fit">{member.department_name}</Badge>
              <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{member.mobile_number}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}