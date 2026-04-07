import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutList, LayoutGrid, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SectorsView({ sectors }) {
  const [viewMode, setViewMode] = useState('grid');

  const sectorColors = {
    'Tourism': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'Marketing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'Hospitality': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'Culture': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'Administration': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    'Technology': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    'Legal': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    'Communications': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Training': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
    'Quality': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
    'Research': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    'Environment': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
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
          {sectors.map((sector) => (
            <Card key={sector.name} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{sector.name}</h3>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <Badge variant="outline">{sector.departments} departments</Badge>
                <Badge variant="outline">{sector.members} members</Badge>
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
        {sectors.map((sector) => (
          <Card key={sector.name} className={`p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow cursor-pointer ${sectorColors[sector.name] || sectorColors['Tourism']}`}>
            <h3 className="font-bold text-lg">{sector.name}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4" />
                <span>{sector.departments} Departments</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{sector.members} Members</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}