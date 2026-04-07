import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, ArrowUpDown } from "lucide-react";
import RankBadge from "./RankBadge";

const SORT_OPTIONS = [
  { label: "Score",           value: "score" },
  { label: "Completion Rate", value: "completion_rate" },
  { label: "Tasks Completed", value: "completed" },
  { label: "Avg. Dept Rate",  value: "avg_dept_rate" },
  { label: "Total Tasks",     value: "total" },
];

const SECTOR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-red-500",
];

export default function SectorsLeaderboard({ sectors = [] }) {
  const [sortBy, setSortBy] = useState("score");

  const sorted = [...sectors].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Layers className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          Top Performing Sectors
        </CardTitle>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <ArrowUpDown className="w-3 h-3 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((s, idx) => (
              <div key={s.name} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <RankBadge rank={idx + 1} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${SECTOR_COLORS[idx % SECTOR_COLORS.length]}`} />
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{s.name}</h3>
                    <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-0 ml-auto">{s.score}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
                    <div><span className="block font-semibold text-slate-900 dark:text-white text-sm">{s.dept_count}</span>Departments</div>
                    <div><span className="block font-semibold text-slate-900 dark:text-white text-sm">{s.member_count}</span>Members</div>
                    <div><span className="block font-semibold text-slate-900 dark:text-white text-sm">{s.completed}/{s.total}</span>Completed</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${s.completion_rate >= 80 ? 'bg-green-500' : s.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${s.completion_rate}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${s.completion_rate >= 80 ? 'text-green-600' : s.completion_rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {s.completion_rate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}